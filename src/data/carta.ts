/**
 * Carta estática de la trattoria — datos compartidos entre
 * la landing page y la página de menú.
 */

export interface PlatoCarta {
  nombre: string;
  italiano: string;
  precio: string;
  favorito?: boolean;
  picante?: boolean;
}

export interface CursoCarta {
  nombre: string;
  platos: PlatoCarta[];
}

export const CURSOS: CursoCarta[] = [
  {
    nombre: 'Entradas',
    platos: [
      { nombre: 'Bruschetta al pomodoro', italiano: 'pan de la casa, tomate, albahaca y aceite toscano', precio: '$16.000' },
      { nombre: 'Carpaccio di manzo', italiano: 'láminas finas, alcaparras y parmigiano', precio: '$34.000' },
    ],
  },
  {
    nombre: 'Primeros',
    platos: [
      { nombre: 'Spaghetti al pomodoro', italiano: 'la ricetta di nonna: San Marzano y albahaca', precio: '$24.000' },
      { nombre: 'Lasagna della nonna', italiano: 'ragù lento, besciamella y gratin al horno', precio: '$38.000', favorito: true },
      { nombre: 'Tagliatelle al tartufo', italiano: 'mantequilla de trufa y parmigiano 24 meses', precio: '$45.000' },
      { nombre: "Penne all'arrabbiata", italiano: 'pomodoro, guindilla y ajo', precio: '$26.000', picante: true },
    ],
  },
  {
    nombre: 'Segundos',
    platos: [
      { nombre: 'Ossobuco alla milanese', italiano: 'con risotto al azafrán', precio: '$58.000' },
      { nombre: 'Pollo alla cacciatora', italiano: 'guiso de cazador, vino tinto y hierbas', precio: '$42.000' },
    ],
  },
  {
    nombre: 'Postres',
    platos: [
      { nombre: 'Tiramisù della casa', italiano: 'café, mascarpone y cacao amargo', precio: '$18.000' },
      { nombre: 'Panna cotta', italiano: 'con frutos rojos de temporada', precio: '$16.000' },
    ],
  },
];
