import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"Luta de Feio — Marica, Hiro, Lobão e Ratão",description:"Escolha seu lutador, convide um amigo e entre na arena. Lutas online com espectadores.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}


