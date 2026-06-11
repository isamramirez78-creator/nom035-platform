export interface Question {
  question: string;
  options: string[];
  domain: string;
  reverseScored?: boolean;
}

// NOM-035-STPS Official Questions - Guide for micro companies (1-15 employees)
const guiaMicroempresaQuestions: Question[] = [
  {
    question: "¿Las condiciones del lugar donde trabajo son seguras?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente"
  },
  {
    question: "¿Mi trabajo me exige hacer mucho esfuerzo físico?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad",
    reverseScored: true
  },
  {
    question: "¿Me preocupa sufrir un accidente en mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente",
    reverseScored: true
  },
  {
    question: "¿Considero que las actividades que realizo son peligrosas?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad",
    reverseScored: true
  },
  {
    question: "¿Por la cantidad de trabajo que tengo debo quedarme tiempo extra?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo",
    reverseScored: true
  },
  {
    question: "¿Mi trabajo me exige estar muy concentrado?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿Mi trabajo requiere que memorice mucha información?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿En mi trabajo tengo que tomar decisiones difíciles muy rápido?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿En mi trabajo soy responsable de cosas de mucho valor?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿En el trabajo me dan órdenes contradictorias?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo",
    reverseScored: true
  },
  {
    question: "¿Estoy satisfecho con mi salario?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente"
  },
  {
    question: "¿Mi horario de trabajo me permite atender mis asuntos personales?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo"
  },
  {
    question: "¿Disfruto mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿En mi trabajo puedo aplicar mis conocimientos?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿Me complace estar en mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente"
  },
  {
    question: "¿En mi trabajo me dan la información necesaria para realizarlo bien?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Los compañeros de trabajo me ayudan cuando tengo dificultades?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿La relación con mis compañeros es cordial?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿En mi trabajo puedo expresar mi punto de vista u opiniones?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi jefe me comunica con claridad las tareas que debo realizar?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi jefe me ayuda para que pueda hacer mejor mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Las tareas que me asignan tienen que ver con mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  }
];

// NOM-035-STPS Official Questions - Guide I (for companies with less than 50 employees)
const guia1Questions: Question[] = [
  {
    question: "El espacio donde trabajo me permite realizar mis actividades de manera segura e higiénica",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente"
  },
  {
    question: "Mi trabajo me exige hacer mucho esfuerzo físico",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad",
    reverseScored: true
  },
  {
    question: "Me preocupa sufrir un accidente en mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente",
    reverseScored: true
  },
  {
    question: "Considero que las actividades que realizo son peligrosas",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad",
    reverseScored: true
  },
  {
    question: "Por la cantidad de trabajo que tengo debo quedarme tiempo extra a mi horario",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo",
    reverseScored: true
  },
  {
    question: "Mi trabajo exige que esté muy concentrado",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "Mi trabajo requiere que memorice mucha información",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "En mi trabajo tengo que tomar decisiones difíciles muy rápido",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "Mi trabajo exige que atienda varios asuntos al mismo tiempo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "En mi trabajo soy responsable de cosas de mucho valor",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "Respondo ante mi jefe por los resultados de toda mi área de trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "En el trabajo me dan órdenes contradictorias",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo",
    reverseScored: true
  },
  {
    question: "Considero que es necesario mantenerme actualizado para hacer bien mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "Mi salario es suficiente para cubrir mis gastos personales",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente"
  },
  {
    question: "Estoy satisfecho con los beneficios que me da la empresa",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente"
  },
  {
    question: "El horario de trabajo me permite atender mis asuntos personales",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo"
  },
  {
    question: "Disfruto cada tarea que realizo en mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "Me siento comprometido con mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "En mi trabajo puedo aplicar mis conocimientos",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "Me complace estar en mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente"
  },
  {
    question: "En mi trabajo me dan la información necesaria y suficiente para realizarlo bien",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "Los compañeros de trabajo me ayudan cuando tengo dificultades",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "La relación con mis compañeros es cordial",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "En mi trabajo puedo expresar mi punto de vista u opiniones",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "Mi jefe tiene en cuenta mis puntos de vista y opiniones",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "Me resulta fácil comunicarme con mi jefe",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "Mi jefe me comunica oportunamente la información relacionada con el trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "La orientación que me da mi jefe me ayuda a realizar mejor mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "Las tareas que me asignan tienen que ver con mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "Me explican claramente los resultados que debo obtener en mi trabajo",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  }
];

// NOM-035-STPS Official Questions - Guide Reference II (Companies with 50+ employees)
const guia2Questions: Question[] = [
  // Ambiente de trabajo (13 preguntas)
  {
    question: "¿Mi trabajo me exige hacer mucho esfuerzo físico?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente",
    reverseScored: true
  },
  {
    question: "¿En mi trabajo estoy expuesto a contaminantes químicos, biológicos o físicos?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente",
    reverseScored: true
  },
  {
    question: "¿La iluminación del área donde trabajo es la adecuada?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente"
  },
  {
    question: "¿El ruido en mi área de trabajo es molesto?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente",
    reverseScored: true
  },
  {
    question: "¿En mi área de trabajo hace mucho calor?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente",
    reverseScored: true
  },
  {
    question: "¿En mi área de trabajo hace mucho frío?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente",
    reverseScored: true
  },
  {
    question: "¿Mi espacio de trabajo me permite moverme libremente?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente"
  },
  {
    question: "¿Mi lugar de trabajo es cómodo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente"
  },
  {
    question: "¿En mi centro de trabajo o área de trabajo se han hecho cambios recientemente?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente",
    reverseScored: true
  },
  {
    question: "¿En mi trabajo existe apoyo técnico cuando lo necesito?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente"
  },
  {
    question: "¿Las herramientas, equipos y materiales que uso para hacer mi trabajo están en buenas condiciones?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente"
  },
  {
    question: "¿Las condiciones del lugar donde trabajo son seguras?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente"
  },
  {
    question: "¿Me preocupa sufrir un accidente en mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "ambiente",
    reverseScored: true
  },

  // Factores propios de la actividad (16 preguntas)
  {
    question: "¿Por la cantidad de trabajo que tengo debo quedarme tiempo extra?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad",
    reverseScored: true
  },
  {
    question: "¿Mi trabajo me exige hacer mucho esfuerzo mental?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿Mi trabajo me exige estar muy concentrado?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿Mi trabajo requiere que memorice mucha información?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿En mi trabajo tengo que tomar decisiones difíciles muy rápido?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿Mi trabajo exige que atienda varios asuntos al mismo tiempo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿En mi trabajo soy responsable del trabajo de otros?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿En mi trabajo soy responsable de la seguridad de otros?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿En mi trabajo soy responsable de bienes o dinero de la empresa?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿Las tareas que realizo las considero peligrosas?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad",
    reverseScored: true
  },
  {
    question: "¿Considero que tengo los conocimientos para hacer mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿Considero que tengo las habilidades para hacer mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿Mi trabajo me permite desarrollar nuevas habilidades?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿Mi trabajo me permite aplicar mis conocimientos?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿Mi trabajo me permite aprender cosas nuevas?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad"
  },
  {
    question: "¿El trabajo que realizo es rutinario?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad",
    reverseScored: true
  },

  // Organización del tiempo de trabajo (6 preguntas)
  {
    question: "¿Trabajo horas extras más de tres veces a la semana?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo",
    reverseScored: true
  },
  {
    question: "¿Mi trabajo me permite tener horarios flexibles?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo"
  },
  {
    question: "¿Puedo decidir cuándo tomar un descanso en mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo"
  },
  {
    question: "¿Puedo decidir la velocidad a la que realizo mis actividades en mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo"
  },
  {
    question: "¿Puedo cambiar el orden de las actividades que realizo en mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo"
  },
  {
    question: "¿Puedo parar un momento para platicar con mis compañeros?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo"
  },

  // Liderazgo y relaciones en el trabajo (36 preguntas)
  {
    question: "¿Mi jefe tiene en cuenta mis puntos de vista y opiniones?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi jefe me comunica con claridad las actividades que debo realizar?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi jefe me explica claramente los resultados que debo obtener en mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi jefe me explica claramente los objetivos de mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi jefe me proporciona información para hacer bien mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi jefe me ayuda para que mejore mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi jefe me comunica a tiempo la información relacionada con el trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿La orientación que me da mi jefe me es útil para hacer mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi jefe me permite participar en la definición de mis actividades en el trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi jefe toma en cuenta mis necesidades?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Siento que puedo confiar en mi jefe?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi jefe me escucha cuando quiero comentarle algo sobre mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi jefe expresa reconocimiento por mis logros?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi jefe me critica por mi forma de hacer el trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo",
    reverseScored: true
  },
  {
    question: "¿Mi jefe me proporciona el apoyo que necesito para hacer mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Siento que puedo expresarle a mi jefe lo que pienso sin que se moleste?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿En mi trabajo puedo expresar mi opinión e ideas?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿En mi trabajo se me informa sobre los asuntos importantes?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿En mi trabajo puedo participar en las decisiones?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿En mi trabajo existe el compañerismo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Puedo confiar en mis compañeros de trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Cuando tengo una carga de trabajo excesiva mis compañeros me ayudan?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mis compañeros de trabajo me ayudan cuando tengo dificultades?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿En mi trabajo las personas nos apoyamos unos a otros?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿En mi trabajo cuando alguien comete un error lo juzgan?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo",
    reverseScored: true
  },
  {
    question: "¿En mi trabajo se reconoce el esfuerzo que hago?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿En mi trabajo se valora mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Cuando hago mi trabajo bien, recibo el reconocimiento de otros?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿El trabajo que realizo me hace sentir realizado como persona?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi trabajo me permite disfrutar de tiempo libre?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿En mi trabajo existe discriminación?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo",
    reverseScored: true
  },
  {
    question: "¿En mi trabajo existe favoritismo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo",
    reverseScored: true
  },
  {
    question: "¿En mi trabajo existe algún conflicto?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo",
    reverseScored: true
  },
  {
    question: "¿Las personas que trabajo conmigo me maltratan?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo",
    reverseScored: true
  },
  {
    question: "¿Entre compañeros solucionamos los problemas de manera respetuosa?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi trabajo permite que desarrolle mis habilidades?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  }
];

// NOM-035-STPS Official Questions - Guide Reference III (Comprehensive assessment for 50+ employees)
const guia3Questions: Question[] = [
  ...guia2Questions,
  // Additional 25 questions for Guide III (Total: 96 questions)
  {
    question: "¿En mi trabajo tengo que atender clientes o usuarios muy enojados?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad",
    reverseScored: true
  },
  {
    question: "¿Mi trabajo me exige atender personas muy necesitadas de ayuda o enfermas?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad",
    reverseScored: true
  },
  {
    question: "¿Para hacer mi trabajo tengo que demostrar sentimientos distintos a los míos?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad",
    reverseScored: true
  },
  {
    question: "¿Mi trabajo me exige atender asuntos de trabajo cuando estoy en casa?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo",
    reverseScored: true
  },
  {
    question: "¿Pienso en las actividades familiares o personales cuando estoy en mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo",
    reverseScored: true
  },
  {
    question: "¿Mis responsabilidades familiares afectan mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo",
    reverseScored: true
  },
  {
    question: "¿Las actividades de mi familia se ven afectadas por las actividades de mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo",
    reverseScored: true
  },
  {
    question: "¿Trabajo los fines de semana?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo",
    reverseScored: true
  },
  {
    question: "¿Trabajo en días de descanso, festivos o en vacaciones?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo",
    reverseScored: true
  },
  {
    question: "¿Considero que el tiempo en el trabajo transcurre lentamente?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "tiempo",
    reverseScored: true
  },
  {
    question: "¿Considero que es necesario mantenerme trabajando al máximo de mi capacidad?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad",
    reverseScored: true
  },
  {
    question: "¿Considero que tengo libertad para decidir cómo hacer mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Considero que mi trabajo me permite ser creativo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿En mi trabajo debo guardar mis emociones para realizar mis actividades?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "actividad",
    reverseScored: true
  },
  {
    question: "¿En mi trabajo puedo ser espontáneo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi trabajo me permite realizar tareas nuevas?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿En mi trabajo se me permite tener contacto directo con las personas beneficiarias de mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿En mi trabajo puedo conocer el resultado final de mis actividades?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Considero que mi trabajo es importante para mi empresa u organización?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Mi trabajo tiene sentido para mí?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Las tareas que me asignan tienen que ver con mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Me informan con claridad cuáles son mis funciones?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Me explican claramente los cambios que ocurren en mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Recibo capacitación útil para hacer mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  },
  {
    question: "¿Recibo capacitación cuando se presentan cambios en mi trabajo?",
    options: ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"],
    domain: "liderazgo"
  }
];

// Cuestionario adicional para identificar acontecimientos traumáticos severos
const cuestionarioEventosTraumaticos: Question[] = [
  {
    question: "¿Presencié o sufrí accidentes de trabajo que tuvieron consecuencias graves?",
    options: ["Sí", "No"],
    domain: "eventos_traumaticos"
  },
  {
    question: "¿Presencié o sufrí asaltos?",
    options: ["Sí", "No"],
    domain: "eventos_traumaticos"
  },
  {
    question: "¿Presencié o sufrí actos violentos?",
    options: ["Sí", "No"],
    domain: "eventos_traumaticos"
  },
  {
    question: "¿Presencié la muerte de alguna persona durante mi trabajo o derivado de éste?",
    options: ["Sí", "No"],
    domain: "eventos_traumaticos"
  },
  {
    question: "¿Sufrí amenazas?",
    options: ["Sí", "No"],
    domain: "eventos_traumaticos"
  },
  {
    question: "¿Me intimidaron?",
    options: ["Sí", "No"],
    domain: "eventos_traumaticos"
  },
  {
    question: "¿Sufrí humillaciones?",
    options: ["Sí", "No"],
    domain: "eventos_traumaticos"
  },
  {
    question: "¿Sufrí hostigamiento?",
    options: ["Sí", "No"],
    domain: "eventos_traumaticos"
  },
  {
    question: "¿Sufrí malos tratos?",
    options: ["Sí", "No"],
    domain: "eventos_traumaticos"
  }
];

export const nom035Questions = {
  microempresa: guiaMicroempresaQuestions,
  guia1: guia1Questions,
  guia2: guia2Questions,
  guia3: guia3Questions,
  eventos_traumaticos: cuestionarioEventosTraumaticos,
};
