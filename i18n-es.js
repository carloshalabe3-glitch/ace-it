/* Spanish (Mexico) for Ace It. Keys are the English text the app shows.
   Words: course = materia, term = periodo, grade = calificación, average = promedio. */
(function (I) {
  'use strict';
  if (!I) return;
  var pl = I.pl;

  I.add({
    // ---------- tabs, titles, common buttons ----------
    'Overview': 'Resumen', 'Terms': 'Periodos', 'Settings': 'Ajustes',
    'Ace It backup': 'Respaldo de Ace It',
    'Back': 'Atrás', 'Cancel': 'Cancelar', 'Close': 'Cerrar', 'Continue': 'Continuar', 'Done': 'Listo',
    'Edit': 'Editar', 'Save': 'Guardar', 'Delete': 'Eliminar', 'Remove': 'Quitar', 'Reset': 'Restablecer',
    'Restore': 'Restaurar', 'Erase': 'Borrar', 'Undo': 'Deshacer', 'Fill': 'Llenar', 'Enter': 'Capturar',
    'Add another': 'Agregar otra', 'Add': 'Agregar', 'More options': 'Más opciones', 'Show all': 'Ver todo', 'Show fewer': 'Ver menos',
    'Add a course': 'Agregar materia', 'Add a term': 'Agregar periodo', 'Add a category': 'Agregar categoría',
    'Add category': 'Agregar categoría', 'Add a goal': 'Agregar meta', 'Add categories': 'Agregar categorías',
    'Add course': 'Agregar materia', 'Add term': 'Agregar periodo',
    'Back up': 'Respaldar', 'Optional': 'Opcional', 'optional': 'opcional', 'opt.': 'opc.',
    'Updated': 'Actualizado', 'Now': 'Ahora', 'Checking…': 'Revisando…',
    'Automatic': 'Automático', 'Light': 'Claro', 'Dark': 'Oscuro',

    // ---------- first launch ----------
    'Every grade,': 'Cada calificación,', 'one clear average.': 'un promedio claro.',
    'Ace It predicts your final grades, tells you what you need on what’s left, and tracks your cumulative average across your whole degree.':
      'Ace It predice tus calificaciones finales, te dice lo que necesitas en lo que falta y lleva tu promedio acumulado de toda la carrera.',
    'Start from scratch': 'Empezar desde cero', 'Restore from backup': 'Restaurar un respaldo',
    'Everything stays on this iPhone. No account, no cloud.': 'Todo se queda en este iPhone. Sin cuenta, sin nube.',
    'Your degree': 'Tu carrera', 'You can change these any time in Settings.': 'Puedes cambiar esto cuando quieras en Ajustes.',
    'Total courses in your degree': 'Total de materias de tu carrera', 'Skip for now': 'Omitir por ahora',
    'Only needed to plan the whole degree. Without it, predictions use the courses you add.':
      'Solo hace falta para planear toda la carrera. Sin esto, las predicciones usan las materias que agregues.',
    'Passing grade': 'Calificación aprobatoria', 'Courses heading below it get flagged.': 'Se marcan las materias que van por debajo.',
    'Your goals': 'Tus metas',
    'Your cumulative is checked against each one, unrounded. Change them to fit your plans.':
      'Tu promedio acumulado se compara con cada una, sin redondear. Cámbialas según tus planes.',
    'How grades round': 'Cómo se redondea',
    'The default for new courses. You can set a different rule for any professor.':
      'La regla para materias nuevas. Puedes usar otra para cualquier profesor.',
    'Round up from .5': 'Sube desde .5', 'Round up from .6': 'Sube desde .6',
    '8.5 becomes 9, 9.49 stays 9, 9.5 becomes 10': '8.5 sube a 9, 9.49 queda en 9, 9.5 sube a 10',
    '8.6 becomes 9, 8.5 stays 8': '8.6 sube a 9, 8.5 queda en 8',
    'Add your first term': 'Agrega tu primer periodo',
    'Enter a whole number of courses, or leave it empty.': 'Escribe un número entero de materias, o déjalo vacío.',
    'Enter a passing grade from 0 to 10.': 'Escribe una calificación aprobatoria de 0 a 10.',
    'Targets go from 0 to 10.': 'Las metas van de 0 a 10.',

    // ---------- overview ----------
    'Add a course': 'Agregar materia',
    'Start with the semester you’re in now, or the first one you finished. Then add its courses.':
      'Empieza con el semestre que cursas ahora, o con el primero que terminaste. Luego agrega sus materias.',
    'Cumulative average': 'Promedio acumulado', 'Projected average': 'Promedio proyectado', 'Projected': 'Proyectado',
    'Possible range': 'Rango posible', 'No grades yet': 'Aún sin calificaciones',
    'Add courses to a term to see your average here.': 'Agrega materias a un periodo para ver aquí tu promedio.',
    'What if…': '¿Y si…?', 'What if': '¿Y si…?', 'Try grades and see your average': 'Prueba y ve tu promedio',
    'Coming up': 'Próximo', 'Pending grade': 'Calificación pendiente',
    'Give your pending exams and projects a date (open the item, then Date) and the next ones show up here, with the grade each one needs.':
      'Ponle fecha a tus exámenes y proyectos pendientes (abre el elemento y luego Fecha) y los siguientes aparecen aquí, con la calificación que necesita cada uno.',
    'Each grade assumes your other pending work comes in at your current average.':
      'Cada calificación supone que lo demás pendiente sale con tu promedio actual.',
    'Tap the circle once you’ve done something. It stays as Pending grade until you enter the grade.':
      'Toca el círculo cuando ya hayas hecho algo. Queda como Calificación pendiente hasta que captures la calificación.',
    'Hold a task to enter its grade.': 'Mantén presionada una tarea para capturar su calificación.',
    'Enter grade': 'Capturar calificación', 'Type the grade first.': 'Escribe primero la calificación.',
    'Use 0 to 10, or points like 17/20.': 'Usa de 0 a 10, o puntos como 17/20.',
    'Today': 'Hoy', 'Tomorrow': 'Mañana', 'Yesterday': 'Ayer',
    'Goals': 'Metas', 'Required': 'Requerido', 'Goal': 'Meta', 'Ideal': 'Ideal', 'Honorable mention': 'Mención honorífica',
    'Honorable': 'Honorífica',
    'Secured': 'Asegurada', 'On track': 'En camino', 'Reachable': 'Alcanzable', 'Out of reach': 'Fuera de alcance',
    'No courses yet': 'Aún sin materias', 'Reached': 'Alcanzada', 'Not reached': 'No alcanzada',
    'Add courses to see where you stand.': 'Agrega materias para ver cómo vas.',
    'Every course is finished.': 'Todas las materias están terminadas.', 'Finished below this goal.': 'Terminaste por debajo de esta meta.',
    'Held whatever happens.': 'Asegurada pase lo que pase.', 'Needs more than a 10 average.': 'Necesita más de 10 de promedio.',
    'Needs': 'Necesita', 'all 9s would do': 'con puros 9 alcanza', 'all 10s': 'puros 10', 'room for one 9': 'cabe un 9',
    'needs': 'necesita', 'all 9s ok': 'puros 9 bien', 'one 9 ok': 'un 9 bien',
    'Shaded: where you can still finish. Hollow dot: projected.': 'Sombreado: donde aún puedes terminar. Punto hueco: proyectado.',
    'In progress': 'En curso', 'Nothing in progress': 'Nada en curso',
    'Courses you’re taking now show up here with their expected final grades.':
      'Las materias que cursas ahora aparecen aquí con su calificación final esperada.',
    'A month since your last backup.': 'Ya pasó un mes desde tu último respaldo.',
    'Your grades only live on this phone.': 'Tus calificaciones solo viven en este teléfono.',

    // ---------- terms ----------
    'No terms yet': 'Aún sin periodos', 'Terms hold your courses: semesters 1 to 8, plus any summer terms.':
      'Los periodos guardan tus materias: semestres del 1 al 8, más cualquier verano.',
    'Averages are the mean of rounded final grades, shown for reference only.':
      'Los promedios son la media de las calificaciones finales redondeadas, solo como referencia.',
    'Summer': 'Verano', 'Semester': 'Semestre', 'Summer term': 'Periodo de verano',
    'Term average': 'Promedio del periodo', 'Projected term average': 'Promedio proyectado del periodo',
    'Term average so far': 'Promedio del periodo hasta ahora',
    'Add each course in this term. You can enter what you know now and fill in grades as they come.':
      'Agrega cada materia de este periodo. Captura lo que sepas ahora y completa las calificaciones conforme lleguen.',
    'Progress': 'Avance', 'Your average over time': 'Tu promedio en el tiempo', 'after each term': 'después de cada periodo',
    'Hollow dot and dashed line: includes courses still in progress.': 'Punto hueco y línea punteada: incluye materias en curso.',
    'Gray lines are your goals. Tap a dot for details.': 'Las líneas grises son tus metas. Toca un punto para ver detalles.',
    'Your final grades': 'Tus calificaciones finales', 'Tap a column to see which courses.': 'Toca una columna para ver qué materias.',
    'Cumulative average after each term': 'Promedio acumulado después de cada periodo',
    'How many finished courses got each final grade': 'Cuántas materias terminadas sacaron cada calificación final',
    'Final grades of finished courses': 'Calificaciones finales de materias terminadas',
    '6 or less': '6 o menos', 'Term': 'Periodo', 'Cumulative': 'Acumulado',
    'Enter final grades': 'Capturar calificaciones finales',
    'Final grades': 'Calificaciones finales', 'Save finals': 'Guardar finales', 'Already final': 'Ya finales',
    'Type at least one final grade, or tap Cancel.': 'Escribe al menos una calificación final, o toca Cancelar.',
    'Finals go from 0 to 10.': 'Las finales van de 0 a 10.',
    'Every course in this term is final.': 'Todas las materias de este periodo ya son finales.',
    'official': 'oficial',
    // term sheet
    'New term': 'Nuevo periodo', 'Edit term': 'Editar periodo', 'Year': 'Año', 'Dates': 'Fechas', 'Name': 'Nombre',
    'Planned courses': 'Materias planeadas', 'For a future term': 'Para un periodo futuro',
    'Move earlier': 'Mover antes', 'Move later': 'Mover después', 'Delete term': 'Eliminar periodo',
    'Already the first term.': 'Ya es el primer periodo.', 'Already the last term.': 'Ya es el último periodo.',
    'Moved earlier.': 'Movido antes.', 'Moved later.': 'Movido después.',
    'Enter a year like 2026, or leave it empty.': 'Escribe un año como 2026, o déjalo vacío.',
    'Planned courses should be a whole number from 0 to 20.': 'Las materias planeadas deben ser un número entero de 0 a 20.',

    // ---------- course ----------
    'Expected final': 'Final esperada', 'Final grade': 'Calificación final', 'Estimate': 'Estimación', 'Final': 'Final',
    'Rounds up from .5': 'Sube desde .5', 'Rounds up from .6': 'Sube desde .6', '.6 rule': 'regla .6',
    'Rule unconfirmed': 'Regla sin confirmar', 'Weights unconfirmed': 'Pesos sin confirmar', 'Not counted': 'No cuenta',
    'Not counted in average': 'No cuenta en el promedio', 'At risk': 'En riesgo', 'At risk.': 'En riesgo.',
    'The expected final is below': 'La final esperada está por debajo de', 'Your grade so far is below': 'Tu calificación hasta ahora está por debajo de',
    'Grades': 'Calificaciones', 'Forecast': 'Pronóstico',
    'Set up how this course is graded': 'Configura cómo se califica esta materia',
    'Add categories and their weights, like “Exams 60 / Homework 40”. Items go under each one.':
      'Agrega categorías y sus pesos, como “Exámenes 60 / Tareas 40”. Los elementos van dentro de cada una.',
    'Projections': 'Proyecciones', 'So far': 'Hasta ahora', 'Expected': 'Esperada', 'Best case': 'Mejor caso', 'Worst case': 'Peor caso',
    'No grades yet': 'Aún sin calificaciones', 'Pending at 10': 'Pendiente en 10', 'Pending at 0': 'Pendiente en 0',
    'If owed points come through': 'Si llegan los puntos que te deben',
    'Expected case with every pending bonus applied': 'Caso esperado con todos los puntos pendientes aplicados',
    'Posted by the school': 'Publicada por la escuela', 'From your items': 'De tus elementos',
    'Best guess': 'Mejor estimación', 'Alternative': 'Alternativa', 'Split': 'Reparto', 'Best': 'Mejor', 'Worst': 'Peor',
    'Weights are marked unconfirmed.': 'Los pesos están marcados sin confirmar.', 'Add an alternative split': 'Agrega un reparto alternativo',
    'to compare.': 'para comparar.',
    'What you need': 'Lo que necesitas', 'Already secured': 'Ya asegurada', 'Not possible': 'No es posible',
    'average on what’s left': 'de promedio en lo que falta',
    'Owed points aren’t counted until you switch them on.': 'Los puntos que te deben no cuentan hasta que los actives.',
    'Nothing graded': 'Nada calificado', 'Pending': 'Pendiente', 'Graded': 'Calificado', 'custom': 'personalizado',
    'Edit categories and weights': 'Editar categorías y pesos', 'Course': 'Materia', 'Finished': 'Terminada',
    'Official final grade': 'Calificación final oficial', 'Optional. Enter it once the school posts it.': 'Opcional. Captúrala cuando la escuela la publique.',
    'Add a course adjustment': 'Agregar un ajuste a la materia',
    'Points added to or taken off the whole course': 'Puntos que se suman o restan a toda la materia',
    'Delete course': 'Eliminar materia', 'Course adjustments': 'Ajustes de la materia', 'Applied': 'Aplicado',
    'Adjustment': 'Ajuste', 'Official grade': 'Calificación oficial', 'Single grade': 'Calificación única', 'Range': 'Rango',
    'Your estimate': 'Tu estimación', 'Assumed (no estimate set)': 'Supuesta (sin estimación)', 'Not set': 'Sin definir',
    'This professor grades at the end, so it counts in your cumulative as an estimate until you enter the official grade.':
      'Este profesor califica al final, así que cuenta en tu acumulado como estimación hasta que captures la calificación oficial.',
    'Try grades': 'Prueba calificaciones', 'not saved': 'no se guarda', 'Expected now': 'Esperada ahora',
    'Final with these grades': 'Final con estas calificaciones', 'Expected with these grades': 'Esperada con estas calificaciones',
    'Your average': 'Tu promedio', 'Official grade removed': 'Calificación oficial quitada',
    'Once the school posts the grade, enter it here (as posted, e.g. 9 or 9.47). It replaces the calculation and marks the course finished.':
      'Cuando la escuela publique la calificación, captúrala aquí (tal cual, p. ej. 9 o 9.47). Reemplaza el cálculo y marca la materia como terminada.',
    'All its categories and grades go too. There’s no undo.': 'También se borran sus categorías y calificaciones. No se puede deshacer.',
    'There’s no undo.': 'No se puede deshacer.',

    // ---------- course sheet ----------
    'New course': 'Nueva materia', 'Edit course': 'Editar materia', 'Course name': 'Nombre de la materia', 'Professor': 'Profesor',
    'Already finished': 'Ya terminada', 'You have the final grade': 'Ya tienes la calificación final',
    '10, or 9.47 if it has decimals': '10, o 9.47 si tiene decimales',
    'As the school posted it. Counts toward your official average.': 'Tal como la publicó la escuela. Cuenta para tu promedio oficial.',
    'Rounding rule': 'Regla de redondeo', 'From .5': 'Desde .5', 'From .6': 'Desde .6',
    '8.5 becomes 9, and 9.49 stays 9.': '8.5 sube a 9, y 9.49 queda en 9.', '8.6 becomes 9, and 8.5 stays 8.': '8.6 sube a 9, y 8.5 queda en 8.',
    'How it’s graded': 'Cómo se califica', 'Weighted': 'Por pesos', 'Categories and weights': 'Categorías y pesos',
    'Category': 'Categoría', 'Weight %': 'Peso %', 'You can add items to each category now or later.': 'Puedes agregar elementos a cada categoría ahora o después.',
    'Edit categories from the course screen.': 'Edita las categorías desde la pantalla de la materia.',
    'No grades until the end. Enter what you expect; it counts as an estimate.': 'Sin calificaciones hasta el final. Escribe lo que esperas; cuenta como estimación.',
    'Low': 'Mínima', 'High': 'Máxima', 'Counts toward average': 'Cuenta en el promedio',
    'Give the course a name.': 'Ponle nombre a la materia.', 'Add a term first.': 'Primero agrega un periodo.',
    'Add a term first, then its courses.': 'Primero agrega un periodo, luego sus materias.',
    'Enter the final grade, from 0 to 10.': 'Escribe la calificación final, de 0 a 10.',
    'Grades go from 0 to 10.': 'Las calificaciones van de 0 a 10.', 'Low should be below high.': 'La mínima debe ser menor que la máxima.',
    'Weights go from 0 to 100.': 'Los pesos van de 0 a 100.', 'Statistics': 'Estadística',
    'Exams': 'Exámenes', 'Homework': 'Tareas', 'Project': 'Proyecto', 'Quizzes': 'Quizzes', 'Participation': 'Participación',

    // ---------- categories sheet ----------
    'Quick entry': 'Captura rápida', 'Compare a best guess with an alternative': 'Compara tu mejor estimación con una alternativa',
    'Guess %': 'Estimado %', 'Alt %': 'Alt. %', 'No categories yet. Use quick entry or add one.': 'Aún sin categorías. Usa la captura rápida o agrega una.',
    'Every category needs a name.': 'Cada categoría necesita nombre.', 'Alternative weights go from 0 to 100.': 'Los pesos alternativos van de 0 a 100.',
    'Type categories like “Exams 60 / Homework 40”.': 'Escribe categorías como “Exámenes 60 / Tareas 40”.',
    '(should be 100%)': '(debe ser 100%)',

    // ---------- item sheet ----------
    'New item': 'Nuevo elemento', 'Edit item': 'Editar elemento', 'Grade': 'Calificación', '8.9 or 17/20': '8.9 o 17/20',
    'Out of 10, or as points like 17/20.': 'Sobre 10, o en puntos como 17/20.', 'Date': 'Fecha',
    'Done, waiting for grade': 'Hecha, esperando calificación', 'Checked off in Coming up': 'Marcada en Próximo',
    'Custom weight %': 'Peso personalizado %',
    'Leave empty to split the category equally. A custom weight is a % of the whole course, like 30 for an exam worth 30%.':
      'Déjalo vacío para repartir la categoría en partes iguales. Un peso personalizado es un % de toda la materia, como 30 para un examen que vale 30%.',
    'Bonus points and adjustments': 'Puntos extra y ajustes', 'Add bonus or adjustment': 'Agregar puntos extra o ajuste',
    'What': 'Qué', 'Points': 'Puntos', '+1 point owed': '+1 punto que te deben',
    'Pending points don’t count until you switch them on.': 'Los puntos pendientes no cuentan hasta que los actives.',
    'Delete item': 'Eliminar elemento',
    'Enter a grade from 0 to 10, or points like 17/20. Or mark it pending.': 'Escribe una calificación de 0 a 10, o puntos como 17/20. O márcala como pendiente.',
    'Weight is a % of the course, from 0 to 100. Or leave it empty.': 'El peso es un % de la materia, de 0 a 100. O déjalo vacío.',
    'Points added to (or taken off) the whole course grade, like a participation bonus. Leave one switched off until it’s confirmed.':
      'Puntos que se suman (o restan) a la calificación de toda la materia, como un extra por participación. Déjalo apagado hasta que se confirme.',
    'Expected case': 'Caso esperado', 'What should pending items count as in the expected projection?': '¿Cuánto deben contar los pendientes en la proyección esperada?',
    'A number': 'Un número', 'Enter a grade from 0 to 10.': 'Escribe una calificación de 0 a 10.',

    // ---------- what if ----------
    'Try final grades for your courses. Nothing here is saved, and your real grades don’t change.':
      'Prueba calificaciones finales para tus materias. Aquí no se guarda nada y tus calificaciones reales no cambian.',
    'What-if cumulative': 'Acumulado de prueba', 'What-if average, whole degree': 'Promedio de prueba, toda la carrera',
    'same as now': 'igual que ahora', 'Your courses in progress': 'Tus materias en curso',
    'The dot marks each course’s expected final right now.': 'El punto marca la final esperada de cada materia ahora.',
    'Add this semester’s courses first, then come back to try grades.': 'Primero agrega las materias de este semestre y luego vuelve a probar calificaciones.',
    'The rest of your degree': 'El resto de tu carrera', 'Reached with these grades.': 'Alcanzada con estas calificaciones.',
    'Add courses to see where you’d stand.': 'Agrega materias para ver cómo quedarías.',
    'Back to your expected grades.': 'De vuelta a tus calificaciones esperadas.',

    // ---------- settings ----------
    'Appearance': 'Apariencia', 'Language': 'Idioma',
    'Automatic · follows your iPhone.': 'Automático · sigue a tu iPhone.', 'Light · this app stays light.': 'Claro · la app se queda clara.',
    'Dark · this app stays dark.': 'Oscuro · la app se queda oscura.',
    'Degree': 'Carrera', 'Total courses in degree': 'Total de materias de la carrera',
    'Not set · optional, for whole-degree predictions': 'Sin definir · opcional, para predecir toda la carrera',
    'Future courses assumed at': 'Materias futuras se suponen en', 'Default rounding': 'Redondeo predeterminado', 'For new courses': 'Para materias nuevas',
    'No goals set. Tap Edit to add one.': 'Sin metas. Toca Editar para agregar una.',
    'Your data': 'Tus datos', 'Backup and restore': 'Respaldo y restauración', 'Not backed up yet': 'Aún sin respaldo', 'Storage': 'Almacenamiento',
    'Protected: the browser won’t clear it to save space.': 'Protegido: el navegador no lo borrará para liberar espacio.',
    'Not protected yet. Add Ace It to your Home Screen to keep it safe.': 'Aún sin proteger. Agrega Ace It a tu pantalla de inicio para protegerlo.',
    'Saved on this device.': 'Guardado en este dispositivo.',
    'Erase all data': 'Borrar todos los datos', 'Erase all data?': '¿Borrar todos los datos?',
    'Every term, course and grade on this phone is deleted. Save a backup first if you might want it back.':
      'Se borra cada periodo, materia y calificación de este teléfono. Guarda un respaldo antes si podrías quererlo de vuelta.',
    'Courses expected to finish below this are flagged at risk.': 'Las materias que se espera terminen por debajo se marcan en riesgo.',
    'Courses you haven’t added yet count at this grade in the projected average. Leave it empty to use your Goal.':
      'Las materias que aún no agregas cuentan con esta calificación en el promedio proyectado. Déjalo vacío para usar tu Meta.',
    'Optional. With it, Ace It plans your whole degree: the average you need on every remaining course, and how many 9s you can afford. Summer courses don’t change the total; they just come out of later terms.':
      'Opcional. Con esto, Ace It planea toda tu carrera: el promedio que necesitas en cada materia restante y cuántos 9 te puedes permitir. Las materias de verano no cambian el total; solo salen de periodos posteriores.',
    'Use Goal': 'Usar Meta', 'Enter a number.': 'Escribe un número.', 'Enter a whole number.': 'Escribe un número entero.',
    'Each goal is checked against your unrounded cumulative average. 9.47 doesn’t reach 9.5.':
      'Cada meta se compara con tu promedio acumulado sin redondear. 9.47 no alcanza 9.5.',
    'Reset to defaults': 'Restablecer', 'Every goal needs a name.': 'Cada meta necesita nombre.', 'Target': 'Meta',
    'Your grades live only on this iPhone. Save a backup file to Files or iCloud Drive now and then, and restore it if you ever reinstall.':
      'Tus calificaciones viven solo en este iPhone. Guarda de vez en cuando un archivo de respaldo en Archivos o iCloud Drive, y restáuralo si reinstalas.',
    'Save backup file': 'Guardar archivo de respaldo', 'Copy backup as text': 'Copiar respaldo como texto',
    'Choose a backup file': 'Elegir archivo de respaldo', 'Or paste backup text here': 'O pega aquí el texto del respaldo',
    'Restore text': 'Restaurar texto', 'Paste your backup text first.': 'Primero pega el texto del respaldo.',
    'Backup copied. Paste it somewhere safe.': 'Respaldo copiado. Pégalo en un lugar seguro.',
    'Backup saved.': 'Respaldo guardado.', 'Backup file saved.': 'Archivo de respaldo guardado.',
    "Couldn't copy. Use Save backup file instead.": 'No se pudo copiar. Usa Guardar archivo de respaldo.',
    'That file isn’t a backup. Check you picked an Ace It backup.': 'Ese archivo no es un respaldo. Revisa que elegiste un respaldo de Ace It.',
    'That doesn’t look like an Ace It backup.': 'Eso no parece un respaldo de Ace It.',
    'That backup is from a newer version of Ace It. Update the app (close and reopen it) and try again.':
      'Ese respaldo es de una versión más nueva de Ace It. Actualiza la app (ciérrala y ábrela) e inténtalo de nuevo.',
    'That backup couldn’t be read.': 'No se pudo leer ese respaldo.', 'That file couldn’t be opened.': 'No se pudo abrir ese archivo.',
    'Replace everything?': '¿Reemplazar todo?',
    "Couldn't save. Your phone may be out of storage.": 'No se pudo guardar. Puede que tu teléfono no tenga espacio.'
  });

  // ---------- text with numbers or names in it ----------
  var P = I.pattern;
  function courses(n) { return n + ' ' + pl(n, 'materia', 'materias'); }
  P(/^(\d+) courses?$/, function (m, n) { return courses(n); });
  P(/^(\d+) items?$/, function (m, n) { return n + ' ' + pl(n, 'elemento', 'elementos'); });
  P(/^(\d+) terms?$/, function (m, n) { return n + ' ' + pl(n, 'periodo', 'periodos'); });
  P(/^(\d+) finals?$/, function (m, n) { return n + ' ' + pl(n, 'final', 'finales'); });
  P(/^Semester (\d+)$/, 'Semestre $1');
  P(/^Summer(?: (\d{4}))?$/, function (m, y) { return 'Verano' + (y ? ' ' + y : ''); });
  P(/^S(\d+)$/, 'S$1');
  P(/^Sum '(\d\d)$/, "Ver '$1");
  P(/^Sum$/, 'Ver');
  P(/^(\d+) courses? in progress$/, function (m, n) { return courses(n) + ' en curso'; });
  P(/^(\d+) courses? left$/, function (m, n) { return pl(n, 'falta ', 'faltan ') + courses(n); });
  P(/^(\d+) finished courses?$/, function (m, n) { return n + ' ' + pl(n, 'materia terminada', 'materias terminadas'); });
  P(/^Official · (\d+) finished courses?$/, function (m, n) { return 'Oficial · ' + n + ' ' + pl(n, 'materia terminada', 'materias terminadas'); });
  P(/^No finished courses yet · (\d+) courses? in progress$/, function (m, n) { return 'Aún sin materias terminadas · ' + courses(n) + ' en curso'; });
  P(/^(\d+) waiting for (?:a grade|grades)$/, function (m, n) { return n + ' ' + pl(n, 'espera calificación', 'esperan calificación'); });
  P(/^Projected: (.+)\.$/, function (m, rest) { return 'Proyectado: ' + projectedParts(rest) + '.'; });
  function projectedParts(rest) {
    return rest.split(', ').map(function (p) {
      var a = p.match(/^(\d+) courses? in progress at expected finals$/);
      if (a) return courses(a[1]) + ' en curso con su final esperada';
      var b = p.match(/^(\d+) future courses? at ([\d.]+) \(assumed\)$/);
      if (b) return b[1] + ' ' + pl(b[1], 'materia futura', 'materias futuras') + ' en ' + b[2] + ' (supuesto)';
      return p;
    }).join(', ');
  }
  P(/^Based on the (\d+) courses? you’ve added\. Set your degree’s total courses in Settings to plan the whole degree\.$/, function (m, n) {
    return 'Con base en ' + pl(n, 'la ', 'las ') + courses(n) + ' que agregaste. Define el total de materias de tu carrera en Ajustes para planear toda la carrera.';
  });
  P(/^Out of (\d+) courses: (\d+) finished, (\d+) in progress, (\d+) still to take\.$/, 'De $1 materias: $2 terminadas, $3 en curso, $4 por cursar.');
  P(/^· room for (\d+) 9s$/, '· caben $1 nueves');
  P(/^room for (\d+) 9s$/, 'caben $1 nueves');
  P(/^· room for one 9$/, '· cabe un 9');
  P(/^· all 9s would do$/, '· con puros 9 alcanza');
  P(/^· all 10s$/, '· puros 10');
  P(/^(\d+) nines ok$/, '$1 nueves bien');
  P(/^keeps your (\d+)$/, 'mantiene tu $1');
  P(/^Your (\d+) is safe$/, 'Tu $1 está seguro');
  P(/^([\d.]+) for an? (\d+)$/, '$1 para un $2');
  P(/^To get an? (\d+)$/, 'Para sacar $1');
  P(/^Raw ([\d.]+) or more$/, 'Real $1 o más');
  P(/^on (.+)$/, function (m, what) { return 'en ' + what; });
  P(/^Was due (.+)$/, function (m, d) { return 'Vencía ' + d; });
  P(/^(\d+) left$/, 'faltan $1');
  P(/^([\d.]+)% left$/, 'falta $1%');
  P(/^([\d.]+)% graded$/, '$1% calificado');
  P(/^Over the ([\d.]+)% graded$/, 'Sobre el $1% calificado');
  P(/^Pending at ([\d.]+) \(your number\)$/, 'Pendiente en $1 (tu número)');
  P(/^Pending at your average \(([\d.]+)\)$/, 'Pendiente en tu promedio ($1)');
  P(/^Pending at ([\d.]+) \(assumed\)$/, 'Pendiente en $1 (supuesto)');
  P(/^(.+) · change$/, function (m, a) { return I.tr(a) + ' · cambiar'; });
  P(/^(Left to grade(?: \(the same average on each\))?: .+?)( Owed points aren’t counted until you switch them on\.)$/, function (m, a) {
    return I.tr(a) + ' Los puntos que te deben no cuentan hasta que los actives.';
  });
  P(/^Left to grade: (.+)$/, function (m, a) { return 'Falta calificar: ' + a; });
  P(/^Left to grade \(the same average on each\): (.+)$/, function (m, a) { return 'Falta calificar (el mismo promedio en cada uno): ' + a; });
  P(/^Not possible \(needs ([\d.]+)\)$/, 'No es posible (necesita $1)');
  P(/^Avg ([\d.]+)$/, 'Prom. $1');
  P(/^No items yet\. The whole ([\d.]+)% counts as pending\.$/, 'Aún sin elementos. Todo el $1% cuenta como pendiente.');
  P(/^Add to (.+)$/, function (m, a) { return 'Agregar a ' + a; });
  P(/^([\d.]+)% \(custom\)$/, '$1% (personalizado)');
  P(/^\+([\d.]+) owed$/, '+$1 te deben');
  P(/^(-?[\d.]+) owed$/, '$1 te deben');
  P(/^Category weights add up to$/, 'Los pesos de las categorías suman');
  P(/^, not 100%\. Grades are scaled to what’s there\.$/, ', no 100%. Las calificaciones se escalan a lo que hay.');
  P(/^Item weights in$/, 'Los pesos de los elementos en');
  P(/^don’t match the category’s weight, so they were scaled to fit\.$/, 'no coinciden con el peso de la categoría, así que se ajustaron.');
  P(/^This course is marked finished, but ([\d.]+)% is still pending and counts as 0\.$/, 'Esta materia está marcada como terminada, pero el $1% sigue pendiente y cuenta como 0.');
  P(/^the passing grade of ([\d.]+)\.$/, 'la calificación aprobatoria de $1.');
  P(/^Posted: ([\d.]+) \(overrides the calculation\)$/, 'Publicada: $1 (reemplaza el cálculo)');
  P(/^(\d+) more planned courses?, assumed at ([\d.]+) until you add (?:it|them)\.$/, function (m, n, v) {
    return n + ' ' + pl(n, 'materia planeada más', 'materias planeadas más') + ', supuestas en ' + v + ' hasta que las agregues.';
  });
  P(/^Total ([\d.]+)%$/, 'Total $1%');
  P(/^Total ([\d.]+)% · ([\d.]+)% left to assign$/, 'Total $1% · falta asignar $2%');
  P(/^Total ([\d.]+)% · over 100%$/, 'Total $1% · más de 100%');
  P(/^Total ([\d.]+)% · alternative ([\d.]+)%( \(should be 100%\))?$/, function (m, a, b, c) { return 'Total ' + a + '% · alternativa ' + b + '%' + (c ? ' (debe ser 100%)' : ''); });
  P(/^Total ([\d.]+)% \(should be 100%\)$/, 'Total $1% (debe ser 100%)');
  P(/^Equal \(([\d.]+)\)$/, 'Igual ($1)');
  P(/^That’s ([\d.]+) out of 10\.$/, 'Eso es $1 sobre 10.');
  P(/^([\d.]+) rounds to (\d+) in your official average\.$/, '$1 se redondea a $2 en tu promedio oficial.');
  P(/^Exam (\d+)$/, 'Examen $1');
  P(/^Item (\d+)$/, 'Elemento $1');
  P(/^Give (.+) a weight\.$/, function (m, a) { return 'Ponle peso a ' + a + '.'; });
  P(/^Give (.+) a weight from 0 to 100\.$/, function (m, a) { return 'Ponle a ' + a + ' un peso de 0 a 100.'; });
  P(/^Name the category that’s worth (.+)%\.$/, 'Ponle nombre a la categoría que vale $1%.');
  P(/^Remove (.+)\?$/, function (m, a) { return '¿Quitar ' + a + '?'; });
  P(/^Its (\d+) items? will be deleted when you save\.$/, function (m, n) { return 'Se borrará' + pl(n, ' su elemento', 'n sus ' + n + ' elementos') + ' al guardar.'; });
  P(/^Delete (.+)\?$/, function (m, a) { return '¿Eliminar ' + a + '?'; });
  P(/^Its (\d+) courses? and all their grades go too\. There’s no undo\.$/, function (m, n) { return 'También se borran ' + pl(n, 'su materia', 'sus ' + n + ' materias') + ' y todas sus calificaciones. No se puede deshacer.'; });
  P(/^Category (\d+) name$/, 'Nombre de la categoría $1');
  P(/^Category (\d+) weight$/, 'Peso de la categoría $1');
  P(/^Remove category (\d+)$/, 'Quitar categoría $1');
  P(/^Done: (.+)$/, function (m, a) { return 'Hecha: ' + a; });
  P(/^Not done yet: (.+)$/, function (m, a) { return 'Aún no: ' + a; });
  P(/^(.+) · pending grade$/, function (m, a) { return a + ' · calificación pendiente'; });
  P(/^(.+) · not done yet$/, function (m, a) { return a + ' · aún no'; });
  P(/^(.+) · pending$/, function (m, a) { return a + ' · pendiente'; });
  P(/^(.+) removed$/, function (m, a) { return a + ' quitado'; });
  P(/^Official grade · ([\d.]+)$/, 'Calificación oficial · $1');
  P(/^Grade for (.+)$/, function (m, a) { return 'Calificación de ' + a; });
  P(/^Try a grade for (.+)$/, function (m, a) { return 'Prueba una calificación para ' + a; });
  P(/^Slide a grade for (.+)$/, function (m, a) { return 'Desliza una calificación para ' + a; });
  P(/^Official final for (.+)$/, function (m, a) { return 'Final oficial de ' + a; });
  P(/^Expected (.+)$/, function (m, a) { return 'Esperada ' + a.replace(/(\d+) items? pending/, function (x, n) { return n + ' ' + pl(n, 'pendiente', 'pendientes'); }).replace('owed points', 'puntos que te deben').replace('estimate', 'estimación').replace('not counted', 'no cuenta'); });
  P(/^(.+)\. Type each final as the school posts it, and leave the rest blank for later\.$/, function (m, t) { return I.tr(t) + '. Escribe cada final cuando la escuela la publique y deja el resto en blanco para después.'; });
  P(/^(\d+) finals? saved\. (\d+) courses? still in progress\.$/, function (m, a, b) { return a + ' ' + pl(a, 'final guardada', 'finales guardadas') + '. ' + courses(b) + ' ' + pl(b, 'sigue', 'siguen') + ' en curso.'; });
  P(/^(\d+) finals? saved\. Every course in this term is final\.$/, function (m, a) { return a + ' ' + pl(a, 'final guardada', 'finales guardadas') + '. Todas las materias de este periodo ya son finales.'; });
  P(/^(On track|Secured|Reachable|Out of reach|No courses yet) →$/, function (m, a) { return I.tr(a) + ' →'; });
  P(/^Now \(projected\): ([\d.]+) ·$/, 'Ahora (proyectado): $1 ·');
  P(/^([+−-][\d.]+) vs now$/, '$1 vs. ahora');
  P(/^After these courses: ([\d.]+)$/, 'Después de estas materias: $1');
  P(/^Then needs a$/, 'Luego necesita');
  P(/^average on the (\d+) courses? after these\.$/, function (m, n) { return 'de promedio en ' + pl(n, 'la materia', 'las ' + n + ' materias') + ' después de estas.'; });
  P(/^Held whatever happens in the (\d+) courses? after these\.$/, function (m, n) { return 'Asegurada pase lo que pase en ' + pl(n, 'la materia', 'las ' + n + ' materias') + ' después de estas.'; });
  P(/^Would need more than a 10 average on the (\d+) courses? after these\.$/, function (m, n) { return 'Necesitaría más de 10 de promedio en ' + pl(n, 'la materia', 'las ' + n + ' materias') + ' después de estas.'; });
  P(/^Every one could be a 9\.$/, 'Todas podrían ser 9.');
  P(/^Every one needs a 10\.$/, 'Todas necesitan 10.');
  P(/^Room for (one 9|\d+ 9s)\.$/, function (m, a) { return 'Caben ' + (a === 'one 9' ? 'un 9' : a.replace(' 9s', ' nueves')) + '.'; });
  P(/^Short by 1 point: raise any one course by 1\.$/, 'Falta 1 punto: sube cualquier materia en 1.');
  P(/^Short by (\d+) points: raise your courses by (\d+) in total\.$/, 'Faltan $1 puntos: sube tus materias $2 en total.');
  P(/^(\d+) future courses? average$/, function (m, n) { return 'Promedio de ' + n + ' ' + pl(n, 'materia futura', 'materias futuras'); });
  P(/^What if · ([\d.–-]+)$/, '¿Y si…? · $1');
  P(/^(.+) final grade$/, function (m, a) { return 'Calificación final de ' + a; });
  P(/^Now (.+)$/, function (m, a) { return 'Ahora ' + a; });
  P(/^After (.+): ([\d.]+)( \(projected\))?( · term average ([\d.]+))?$/, function (m, t, v, p, x, ta) { return 'Después de ' + I.tr(t) + ': ' + v + (p ? ' (proyectado)' : '') + (ta ? ' · promedio del periodo ' + ta : ''); });
  P(/^(\d+|6 or less): (.+)$/, function (m, a, names) { return I.tr(a) + ': ' + names; });
  P(/^Last backup: today$/, 'Último respaldo: hoy');
  P(/^Last backup: yesterday$/, 'Último respaldo: ayer');
  P(/^Last backup: (\d+) days ago$/, 'Último respaldo: hace $1 días');
  P(/^Restored (\d+) terms? and (\d+) courses?\.$/, function (m, a, b) { return 'Se restauraron ' + a + ' ' + pl(a, 'periodo', 'periodos') + ' y ' + courses(b) + '.'; });
  P(/^This replaces all the data on this phone with the backup’s (\d+) terms? and (\d+) courses?\. There’s no undo\.$/, function (m, a, b) {
    return 'Esto reemplaza todos los datos de este teléfono con ' + a + ' ' + pl(a, 'periodo', 'periodos') + ' y ' + courses(b) + ' del respaldo. No se puede deshacer.';
  });
  P(/^(\d+) courses$/, function (m, n) { return courses(n); });
  P(/^([\d.]+) · courses below it are flagged at risk$/, '$1 · las materias por debajo se marcan en riesgo');
  P(/^([\d.]+) \(your Goal\)$/, '$1 (tu Meta)');
  P(/^Version (.+) · data format (\d+)$/, 'Versión $1 · formato de datos $2');
  P(/^Enter a number from ([\d.]+) to ([\d.]+)\.$/, 'Escribe un número de $1 a $2.');
  P(/^Moved (earlier|later)\.$/, function (m, a) { return a === 'earlier' ? 'Movido antes.' : 'Movido después.'; });
  P(/^(\d+) future courses? at ([\d.]+) \(assumed\)$/, function (m, n, v) { return n + ' ' + pl(n, 'materia futura', 'materias futuras') + ' en ' + v + ' (supuesto)'; });
  P(/^Added (.+) · (.+)$/, function (m, a, b) { return 'Agregada ' + a + ' · ' + b; });
  I.add({
    'Courses': 'Materias', 'Status': 'Estado', 'rounds to': 'se redondea a', 'to': 'a',
    'short by': 'faltan', 'short by 1 point': 'falta 1 punto', 'point': 'punto', 'points': 'puntos',
    'Hollow dot and dashed line: includes courses still in progress. Gray lines are your goals. Tap a dot for details.':
      'Punto hueco y línea punteada: incluye materias en curso. Las líneas grises son tus metas. Toca un punto para ver detalles.',
    'Gray lines are your goals. Tap a dot for details.': 'Las líneas grises son tus metas. Toca un punto para ver detalles.',
    'keeps your grades on this iPhone only. No account, no cloud.': 'guarda tus calificaciones solo en este iPhone. Sin cuenta, sin nube.',
    'all 9s ok': 'puros 9 bien'
  });
  P(/^· (.+)$/, function (m, a) { return '· ' + I.tr(a); });
  P(/^alt ([\d.]+%?)$/, 'alt. $1');
  P(/^(\d+) planned$/, '$1 planeadas');
  P(/^in (\d+) days?$/, function (m, n) { return 'en ' + n + ' ' + pl(n, 'día', 'días'); });
  P(/^([\d.]+) \(projected\)$/, '$1 (proyectado)');
  P(/^projected ([\d.]+)$/, 'proyectado $1');
  P(/^can finish ([\d.]+)–([\d.]+)$/, 'puedes terminar entre $1 y $2');
  P(/^needs ([\d.]+)$/, 'necesita $1');
  P(/^Back to (.+)$/, function (m, a) { return 'Volver a ' + I.tr(a); });
  P(/^What-if ([\d.]+)$/, 'De prueba $1');
  P(/^The rest counts at ([\d.]+), your expected grade\.$/, 'Lo demás cuenta en $1, tu calificación esperada.');
  P(/^The rounded final is (\d+) either way\.$/, 'La final redondeada es $1 de cualquier forma.');
  P(/^The rounded final changes: (\d+) with the best guess, (\d+) with the alternative\.$/, 'La final redondeada cambia: $1 con la mejor estimación, $2 con la alternativa.');
  P(/^(The expected final|Your grade so far) is below the passing grade of ([\d.]+)\.$/, function (m, who, v) {
    return (who === 'The expected final' ? 'La final esperada' : 'Tu calificación hasta ahora') + ' está por debajo de la aprobatoria de ' + v + '.';
  });
  P(/^For terms you haven’t started: how many courses you expect\. They count at ([\d.]+) in projections until you add them\.$/,
    'Para periodos que no has empezado: cuántas materias esperas. Cuentan en $1 en las proyecciones hasta que las agregues.');
  // A goal or label followed by its number ("Goal 9", "9.5 Honorable"): translate the words.
  P(/^([\d.]+) ([A-Za-z][A-Za-z ]*)$/, function (m, n, w) { return n + ' ' + I.tr(w); });
  P(/^([A-Za-z][A-Za-z ]*?) ([\d.]+)$/, function (m, w, n) { return I.tr(w) + ' ' + n; });
  P(/^(\d+) courses in this term$/, function (m, n) { return courses(n) + ' en este periodo'; });
})(typeof I18N !== 'undefined' ? I18N : (typeof module === 'object' ? require('./i18n.js') : null));
