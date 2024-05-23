use axum::{
    extract::State,
    http::StatusCode,
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
use tracing::{error, info};

const DEFAULT_LISTEN_ADDR: &str = "127.0.0.1:9001";

#[derive(Clone)]
struct AppState {
    jwt_secret: Vec<u8>,
    aes_key: Vec<u8>,
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
            Json(serde_json::json!({"error": self.0.to_string()})),
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

async fn hash_password(Json(req): Json<HashRequest>) -> Result<Json<HashResponse>, AppError> {
    let salt = generate_random_bytes(16)?;
    let argon2 = argon2::Argon2::default();
    let mut hash_bytes = [0u8; 32];
    argon2.hash_password_into(req.password.as_bytes(), &salt, &mut hash_bytes)?;
    Ok(Json(HashResponse {
        hash: format!("{}.{}", hex::encode(&salt), hex::encode(hash_bytes)),
    }))
}

async fn verify_password(Json(req): Json<VerifyRequest>) -> Result<Json<VerifyResponse>, AppError> {
    let parts: Vec<&str> = req.hash.split('.').collect();
    if parts.len() != 2 {
        return Ok(Json(VerifyResponse { valid: false }));
    }
    let salt = hex::decode(parts[0])?;
    let expected = hex::decode(parts[1])?;
    let argon2 = argon2::Argon2::default();
    let mut hash_bytes = [0u8; 32];
    argon2.hash_password_into(req.password.as_bytes(), &salt, &mut hash_bytes)?;
    Ok(Json(VerifyResponse {
        valid: hash_bytes.as_slice() == expected.as_slice(),
    }))
}

async fn sign_token(
    State(state): State<Arc<AppState>>,
    Json(req): Json<SignRequest>,
) -> Result<Json<SignResponse>, AppError> {
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
    let aes_key_hex = env::var("AES_KEY").expect("AES_KEY environment variable must be set");
    let aes_key = hex::decode(aes_key_hex).expect("AES_KEY must be a valid 64-char hex string");
    if aes_key.len() != 32 {
        panic!("AES_KEY must be 256 bits (32 bytes, 64 hex characters)");
    }

    let state = Arc::new(AppState {
        jwt_secret,
        aes_key,
    });

    let app = Router::new()
        .route("/v1/hash", post(hash_password))
        .route("/v1/verify", post(verify_password))
        .route("/v1/token/sign", post(sign_token))
        .route("/v1/token/verify", post(verify_token))
        .route("/v1/encrypt", post(encrypt))
        .route("/v1/decrypt", post(decrypt))
        .with_state(state);

    let addr = env::var("LISTEN_ADDR").unwrap_or_else(|_| DEFAULT_LISTEN_ADDR.to_string());
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    info!("HerbTable security service listening on {}", addr);
    axum::serve(listener, app).await.unwrap();
}
