use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use axum::{
    extract::{DefaultBodyLimit, Request, State},
    http::StatusCode,
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::post,
    Json, Router,
};
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use ring::rand::SecureRandom;
use serde::{Deserialize, Serialize};
use std::env;
use std::sync::Arc;
use subtle::ConstantTimeEq;
use tracing::{error, info};

const DEFAULT_LISTEN_ADDR: &str = "127.0.0.1:9001";

#[derive(Clone)]
struct AppState {
    jwt_secret: Vec<u8>,
    aes_key: Vec<u8>,
    service_key: Vec<u8>,
    hashing_slots: Arc<tokio::sync::Semaphore>,
}

#[derive(Deserialize)]
struct HashRequest {
    password: String,
}

#[derive(Serialize)]
struct HashResponse {
    hash: String,
}

#[derive(Deserialize)]
struct VerifyRequest {
    password: String,
    hash: String,
}

#[derive(Serialize)]
struct VerifyResponse {
    valid: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    hash: Option<String>,
}

#[derive(Deserialize, Serialize, Clone)]
struct TokenClaims {
    sub: String,
    email: String,
    role: String,
    exp: usize,
}

#[derive(Deserialize)]
struct SignRequest {
    sub: String,
    email: String,
    role: String,
    exp: usize,
}

#[derive(Serialize)]
struct SignResponse {
    token: String,
}

#[derive(Deserialize)]
struct VerifyTokenRequest {
    token: String,
}

#[derive(Serialize)]
struct VerifyTokenResponse {
    valid: bool,
    claims: Option<TokenClaims>,
}

#[derive(Deserialize)]
struct EncryptRequest {
    plaintext: String,
}

#[derive(Serialize)]
struct EncryptResponse {
    ciphertext: String,
}

#[derive(Deserialize)]
struct DecryptRequest {
    ciphertext: String,
}

#[derive(Serialize)]
struct DecryptResponse {
    plaintext: String,
}

struct AppError(anyhow::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        error!("internal error: {}", self.0);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "internal service error"})),
        )
            .into_response()
    }
}

impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}

fn generate_random_bytes(len: usize) -> anyhow::Result<Vec<u8>> {
    let rng = ring::rand::SystemRandom::new();
    let mut buf = vec![0u8; len];
    rng.fill(&mut buf)?;
    Ok(buf)
}

fn hash_phc(password: &str) -> anyhow::Result<String> {
    anyhow::ensure!(
        !password.is_empty() && password.len() <= 1024,
        "invalid password length"
    );
    let salt = SaltString::encode_b64(&generate_random_bytes(16)?)?;
    Ok(argon2::Argon2::default()
        .hash_password(password.as_bytes(), &salt)?
        .to_string())
}
fn verify_hash(password: &str, encoded: &str) -> anyhow::Result<VerifyResponse> {
    if password.len() > 1024 || encoded.len() > 1024 {
        return Ok(VerifyResponse {
            valid: false,
            hash: None,
        });
    }
    if encoded.starts_with('$') {
        let parsed = match PasswordHash::new(encoded) {
            Ok(p) => p,
            Err(_) => {
                return Ok(VerifyResponse {
                    valid: false,
                    hash: None,
                })
            }
        };
        // Avoid resource amplification through untrusted PHC parameters.
        let m = parsed.params.get_decimal("m").unwrap_or(0);
        let t = parsed.params.get_decimal("t").unwrap_or(0);
        let p = parsed.params.get_decimal("p").unwrap_or(0);
        if m > 65536 || t > 10 || p > 4 {
            return Ok(VerifyResponse {
                valid: false,
                hash: None,
            });
        }
        return Ok(VerifyResponse {
            valid: argon2::Argon2::default()
                .verify_password(password.as_bytes(), &parsed)
                .is_ok(),
            hash: None,
        });
    }
    let parts: Vec<_> = encoded.split('.').collect();
    if parts.len() != 2 {
        return Ok(VerifyResponse {
            valid: false,
            hash: None,
        });
    }
    let salt = match hex::decode(parts[0]) {
        Ok(v) if v.len() == 16 => v,
        _ => {
            return Ok(VerifyResponse {
                valid: false,
                hash: None,
            })
        }
    };
    let expected = match hex::decode(parts[1]) {
        Ok(v) if v.len() == 32 => v,
        _ => {
            return Ok(VerifyResponse {
                valid: false,
                hash: None,
            })
        }
    };
    let mut actual = [0; 32];
    argon2::Argon2::default().hash_password_into(password.as_bytes(), &salt, &mut actual)?;
    let valid = bool::from(actual.as_slice().ct_eq(&expected));
    Ok(VerifyResponse {
        valid,
        hash: if valid {
            Some(hash_phc(password)?)
        } else {
            None
        },
    })
}
async fn hash_password(
    State(state): State<Arc<AppState>>,
    Json(req): Json<HashRequest>,
) -> Result<Json<HashResponse>, AppError> {
    let slot = state.hashing_slots.clone().try_acquire_owned()?;
    let hash = tokio::task::spawn_blocking(move || {
        let _slot = slot;
        hash_phc(&req.password)
    })
    .await??;
    Ok(Json(HashResponse { hash }))
}
async fn verify_password(
    State(state): State<Arc<AppState>>,
    Json(req): Json<VerifyRequest>,
) -> Result<Json<VerifyResponse>, AppError> {
    let slot = state.hashing_slots.clone().try_acquire_owned()?;
    let result = tokio::task::spawn_blocking(move || {
        let _slot = slot;
        verify_hash(&req.password, &req.hash)
    })
    .await??;
    Ok(Json(result))
}
async fn authenticate(
    State(state): State<Arc<AppState>>,
    request: Request,
    next: Next,
) -> Response {
    let key = request
        .headers()
        .get("X-Internal-Key")
        .map(|v| v.as_bytes())
        .unwrap_or_default();
    if !bool::from(key.ct_eq(&state.service_key)) {
        return StatusCode::UNAUTHORIZED.into_response();
    }
    next.run(request).await
}
fn valid_secret(secret: &[u8]) -> bool {
    let unique: std::collections::HashSet<_> = secret.iter().collect();
    secret.len() >= 32 && unique.len() >= 8
}
async fn sign_token(
    State(state): State<Arc<AppState>>,
    Json(req): Json<SignRequest>,
) -> Result<Json<SignResponse>, AppError> {
    let now = jsonwebtoken::get_current_timestamp() as usize;
    if !(!req.sub.is_empty()
        && matches!(req.role.as_str(), "creator" | "user" | "admin")
        && req.exp > now
        && req.exp <= now + 3600)
    {
        return Err(anyhow::anyhow!("invalid claims").into());
    }
    let claims = TokenClaims {
        sub: req.sub,
        email: req.email,
        role: req.role,
        exp: req.exp,
    };
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(&state.jwt_secret),
    )?;
    Ok(Json(SignResponse { token }))
}

async fn verify_token(
    State(state): State<Arc<AppState>>,
    Json(req): Json<VerifyTokenRequest>,
) -> Result<Json<VerifyTokenResponse>, AppError> {
    match decode::<TokenClaims>(
        &req.token,
        &DecodingKey::from_secret(&state.jwt_secret),
        &Validation::default(),
    ) {
        Ok(token_data) => Ok(Json(VerifyTokenResponse {
            valid: true,
            claims: Some(token_data.claims),
        })),
        Err(_) => Ok(Json(VerifyTokenResponse {
            valid: false,
            claims: None,
        })),
    }
}

fn aes_encrypt(key: &[u8], plaintext: &str) -> anyhow::Result<String> {
    let nonce_bytes = generate_random_bytes(12)?;
    let unbound_key = ring::aead::UnboundKey::new(&ring::aead::AES_256_GCM, key)?;
    let sealing_key = ring::aead::LessSafeKey::new(unbound_key);
    let nonce = ring::aead::Nonce::assume_unique_for_key(nonce_bytes[..12].try_into()?);
    let mut ciphertext = plaintext.as_bytes().to_vec();
    let aad = ring::aead::Aad::empty();
    sealing_key.seal_in_place_append_tag(nonce, aad, &mut ciphertext)?;
    let mut result = nonce_bytes;
    result.extend_from_slice(&ciphertext);
    Ok(BASE64_STANDARD.encode(&result))
}

fn aes_decrypt(key: &[u8], ciphertext_b64: &str) -> anyhow::Result<String> {
    let data = BASE64_STANDARD.decode(ciphertext_b64)?;
    if data.len() < 12 {
        return Err(anyhow::anyhow!("invalid ciphertext"));
    }
    let (nonce_bytes, encrypted) = data.split_at(12);
    let unbound_key = ring::aead::UnboundKey::new(&ring::aead::AES_256_GCM, key)?;
    let opening_key = ring::aead::LessSafeKey::new(unbound_key);
    let nonce = ring::aead::Nonce::try_assume_unique_for_key(nonce_bytes)?;
    let mut plaintext_and_tag = encrypted.to_vec();
    let aad = ring::aead::Aad::empty();
    let plaintext = opening_key.open_in_place(nonce, aad, &mut plaintext_and_tag)?;
    Ok(String::from_utf8(plaintext.to_vec())?)
}

async fn encrypt(
    State(state): State<Arc<AppState>>,
    Json(req): Json<EncryptRequest>,
) -> Result<Json<EncryptResponse>, AppError> {
    let ciphertext = aes_encrypt(&state.aes_key, &req.plaintext)?;
    Ok(Json(EncryptResponse { ciphertext }))
}

async fn decrypt(
    State(state): State<Arc<AppState>>,
    Json(req): Json<DecryptRequest>,
) -> Result<Json<DecryptResponse>, AppError> {
    let plaintext = aes_decrypt(&state.aes_key, &req.ciphertext)?;
    Ok(Json(DecryptResponse { plaintext }))
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let jwt_secret = env::var("JWT_SECRET")
        .expect("JWT_SECRET environment variable must be set")
        .into_bytes();
    assert!(
        valid_secret(&jwt_secret),
        "JWT_SECRET requires >=32 random bytes; weak/empty values are rejected"
    );
    let service_key = env::var("SECURITY_SERVICE_KEY")
        .expect("SECURITY_SERVICE_KEY must be set")
        .into_bytes();
    assert!(
        valid_secret(&service_key),
        "SECURITY_SERVICE_KEY requires >=32 random bytes"
    );
    let aes_key_hex = env::var("AES_KEY").expect("AES_KEY environment variable must be set");
    let aes_key = hex::decode(aes_key_hex).expect("AES_KEY must be a valid 64-char hex string");
    if aes_key.len() != 32 {
        panic!("AES_KEY must be 256 bits (32 bytes, 64 hex characters)");
    }

    let state = Arc::new(AppState {
        jwt_secret,
        aes_key,
        service_key,
        hashing_slots: Arc::new(tokio::sync::Semaphore::new(4)),
    });

    let app = Router::new()
        .route("/v1/hash", post(hash_password))
        .route("/v1/verify", post(verify_password))
        .route("/v1/token/sign", post(sign_token))
        .route("/v1/token/verify", post(verify_token))
        .route("/v1/encrypt", post(encrypt))
        .route("/v1/decrypt", post(decrypt))
        .layer(DefaultBodyLimit::max(16 * 1024))
        .layer(middleware::from_fn_with_state(state.clone(), authenticate))
        .with_state(state);

    let addr = env::var("SECURITY_LISTEN_ADDR").unwrap_or_else(|_| DEFAULT_LISTEN_ADDR.to_string());
    let socket: std::net::SocketAddr = addr
        .parse()
        .expect("SECURITY_LISTEN_ADDR must be an IP:port");
    assert!(
        socket.ip().is_loopback(),
        "security service must bind loopback"
    );
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    info!("HerbTable security service listening on {}", addr);
    axum::serve(listener, app).await.unwrap();
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn empty_and_weak_keys_rejected() {
        assert!(!valid_secret(b""));
        assert!(!valid_secret(&[b'x'; 32]));
        assert!(valid_secret(b"0123456789abcdef0123456789abcdef"));
    }
    #[test]
    fn phc_roundtrip_and_wrong_password() {
        let hash = hash_phc("valid + unicode 密码").unwrap();
        assert!(hash.starts_with("$argon2id$"));
        assert!(verify_hash("valid + unicode 密码", &hash).unwrap().valid);
        assert!(!verify_hash("wrong", &hash).unwrap().valid);
    }
    #[test]
    fn legacy_hash_is_upgraded_on_success() {
        let salt = [1; 16];
        let mut hash = [0; 32];
        argon2::Argon2::default()
            .hash_password_into(b"test", &salt, &mut hash)
            .unwrap();
        let old = format!("{}.{}", hex::encode(salt), hex::encode(hash));
        let r = verify_hash("test", &old).unwrap();
        assert!(r.valid);
        assert!(r.hash.unwrap().starts_with("$argon2id$"));
    }
    #[test]
    fn malformed_hash_is_rejected() {
        assert!(!verify_hash("test", "00.00").unwrap().valid);
        assert!(!verify_hash("test", "$argon2id$bad").unwrap().valid);
    }
}
