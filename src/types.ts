export interface ThemeConfig {
    file: string;
    nombre: string;
    id: string;
    colores: {
        fondo: string;
        acentos: string;
        texto_titulos: string;
        tarjetas: string;
        barras_progreso: string;
    };
    config_home: {
        icono: string;
        subtitulo: string;
    };
    efecto?: string;
}

export type Page = 'login' | 'welcome' | 'campaign_selector' | 'dashboard' | 'admin_home' | 'admin_dashboard' | 'resumen_promotoria' | 'gerencia_eduardo' | 'gerencia_karen';

export interface AdvisorData {
    Asesor: string;
    [key: string]: any;
}
