import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
interface Theme { primaryColor:string;fontSize:number;backgroundImage:string;backgroundOpacity:number;sidebarColor:string;sidebarOpacity:number; }
interface ThemeContextType {theme:Theme;setTheme:(patch:Partial<Theme>)=>void;resetTheme:()=>void;}
const defaults:Theme={primaryColor:'#2563eb',fontSize:14,backgroundImage:'',backgroundOpacity:85,sidebarColor:'#1e293b',sidebarOpacity:100};
const ThemeContext=createContext<ThemeContextType|undefined>(undefined);
function bounded(v:unknown,low:number,high:number,fallback:number){return typeof v==='number'&&Number.isFinite(v)?Math.min(high,Math.max(low,v)):fallback;}
function normalize(value:Partial<Theme>):Theme {
 const color=(v:unknown,f:string)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:f;
 const image=typeof value.backgroundImage==='string'&&value.backgroundImage.length<2_000_000&&(/^(https?:\/\/|data:image\/)/.test(value.backgroundImage)||value.backgroundImage==='')?value.backgroundImage:'';
 return {primaryColor:color(value.primaryColor,defaults.primaryColor),fontSize:bounded(value.fontSize,10,32,14),backgroundImage:image,backgroundOpacity:bounded(value.backgroundOpacity,0,100,85),sidebarColor:color(value.sidebarColor,defaults.sidebarColor),sidebarOpacity:bounded(value.sidebarOpacity,0,100,100)};
}
function load():Theme {try{const raw=JSON.parse(localStorage.getItem('herbtable:theme:v1')||'null');return raw&&typeof raw==='object'?normalize(raw):defaults;}catch{return defaults;}}
export function ThemeProvider({children}:{children:ReactNode}) {
 const [theme,setState]=useState(load);
 const setTheme=(patch:Partial<Theme>)=>setState(current=>normalize({...current,...patch}));
 const resetTheme=()=>setState({...defaults});
 useEffect(()=>{try{localStorage.setItem('herbtable:theme:v1',JSON.stringify(theme));}catch{/* Theme remains usable in memory. */}
 document.documentElement.style.setProperty('--bg-color',theme.sidebarColor);
 document.documentElement.style.setProperty('--bg-opacity',String(theme.backgroundOpacity/100));
 document.documentElement.style.fontSize=`${theme.fontSize}px`;
 },[theme]);
 return <ThemeContext.Provider value={{theme,setTheme,resetTheme}}>{children}</ThemeContext.Provider>;
}
export function useTheme(){const ctx=useContext(ThemeContext);if(!ctx)throw new Error('useTheme must be used within ThemeProvider');return ctx;}
