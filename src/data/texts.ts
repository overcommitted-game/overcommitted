import type { IncidentKind, ItemType, StationType, TaskKind } from '../core/types';

// All the game's copy lives here (Rioplatense Spanish, voseo). Polished in T15.
export const TEXTS: {
  title: string;
  tagline: string;
  controls: string[];
  startButton: string;
  replayButton: string;
  stations: Record<StationType, string>;
  items: Record<ItemType, string>;
  tasks: Record<TaskKind, string>;
  incidents: Record<IncidentKind, string>;
  results: {
    title: string;
    completed: string;
    expired: string;
    incidents: string;
    best: string;
    newRecord: string;
    byStars: [string, string, string, string];
  };
} = {
  title: 'Overcommitted',
  tagline: 'Buscás laburo, hacés freelance, estudiás inglés y se te prende fuego la notebook. Un día normal.',
  controls: [
    'WASD: moverte',
    'E: agarrar / dejar (tocá) o trabajar (mantené)',
    'Flechas: apagar incendios (en emergencias)',
  ],
  startButton: 'Jugar',
  replayButton: 'Jugar de nuevo',
  stations: {
    notebook: 'Notebook',
    agent: 'Agente IA',
    coffee: 'Cafetera',
    study: 'Estudio',
    interview: 'Entrevistas',
    linkedin: 'LinkedIn',
    counter: 'Mesa',
  },
  items: {
    prompt: 'Prompt listo',
    pr: 'PR para revisar',
    englishNotes: 'Apuntes de inglés',
    frameworkNotes: 'Apuntes del framework',
  },
  tasks: {
    clientBug: 'Bug del cliente',
    sideFeature: 'Feature del proyecto propio',
    englishInterview: 'Entrevista en inglés',
    spanishInterview: 'Entrevista en español',
    techTest: 'Prueba técnica',
    jobApplication: 'Postularte',
  },
  incidents: {
    fire: '¡Se te prendió fuego la notebook, crack!',
    npmVuln: 'Vulnerabilidad en un paquete de npm',
    hallucination: 'El agente alucinó y rompió todo',
  },
  results: {
    title: 'Se terminó la jornada',
    completed: 'Tareas completadas',
    expired: 'Tareas vencidas',
    incidents: 'Incidentes resueltos',
    best: 'Tu mejor puntaje',
    newRecord: '¡Nuevo récord!',
    byStars: [
      'Te quedaste sin laburo. Probá de nuevo.',
      'Zafaste, pero el cliente no está contento.',
      'Bien ahí, te dieron el visto bueno.',
      '¡Te contrataron! Con aumento y todo.',
    ],
  },
};
