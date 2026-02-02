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

export type Page = 'welcome' | 'campaign_selector' | 'dashboard';

export interface AdvisorData {
    Asesor: string;
    [key: string]: any;
}
