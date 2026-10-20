// Dónde pide el Currículo Nacional cada práctica de cálculo, grado por grado.
//
// Cada cita es un fragmento copiado letra por letra de un desempeño oficial de Matemática del grado
// (packages/curriculo, programas curriculares del MINEDU). Un nivel de habilidades.ts solo se ofrece en los grados
// donde tiene cita, y `npm run verificar:curriculo` comprueba que cada cita exista tal cual en el texto oficial.
// Nada de "creo que": si el desempeño del grado no lo dice, no va.

export type Citas = Partial<Record<string, string>>

/** Solo algunos grados de un grupo de citas. */
export function de(citas: Citas, ...grados: string[]): Citas {
  return Object.fromEntries(grados.map((g) => [g, citas[g]]))
}

export const CITAS = {
  conteo: {
    'primaria-1': 'del número como cardinal al determinar una cantidad de hasta 50 objetos',
  },
  comparar: {
    'primaria-1': 'de la comparación y el orden entre dos cantidades',
    'primaria-2': 'de la comparación entre números',
    'primaria-3': 'el valor posicional de una cifra en números de tres cifras y la comparación y el orden de números',
    'primaria-4': 'el valor posicional de un dígito en números de cuatro cifras y la comparación y el orden de números',
    'primaria-5': 'Realiza afirmaciones sobre las relaciones (orden y otras) entre números naturales',
  },
  valorPosicional: {
    'primaria-1': 'su comprensión de la decena como grupo de diez unidades',
    'primaria-2': 'el valor posicional de una cifra en números de hasta dos cifras',
    'primaria-3': 'su comprensión sobre la centena como nueva unidad en el sistema de numeración decimal, sus equivalencias con decenas y unidades',
    'primaria-4': 'La unidad de millar como unidad del sistema de numeración decimal, sus equivalencias entre unidades menores',
  },
  redondeo: {
    'primaria-3': 'completar a la centena más cercana y aproximaciones',
    'primaria-4': 'completar al millar más cercano, uso de la propiedad distributiva, redondeo a múltiplos de 10',
  },
  patrones: {
    'primaria-1': 'entre cantidades que aumentan regularmente, y los transforma en patrones de repetición o en patrones aditivos',
    'primaria-2': 'cómo aumentan o disminuyen los números en un patrón aditivo con números de hasta 2 cifras',
    'primaria-3': 'patrones aditivos (con números de hasta 3 cifras)',
    'primaria-4': 'patrones aditivos o multiplicativos (con números de hasta 4 cifras)',
    'primaria-6': 'patrones aditivos o multiplicativos',
  },
  sumarRestar: {
    'primaria-1': 'expresiones numéricas (modelo) de adición o sustracción con números naturales hasta 20',
    'primaria-2': 'expresiones numéricas (modelo) de adición o sustracción con números naturales de hasta dos cifras',
    'primaria-3': 'de adición, sustracción, multiplicación y división con números naturales de hasta tres cifras',
    'primaria-4': 'de adición, sustracción, multiplicación y división con números naturales de hasta cuatro cifras',
    'primaria-5': 'de adición, sustracción, multiplicación y división con números naturales',
    'primaria-6': 'de adición, sustracción, multiplicación y división de dos números naturales',
  },
  multiplicarDividir: {
    'primaria-3': 'su comprensión de la multiplicación y división con números naturales hasta 100',
    'primaria-4': 'La multiplicación y división con números naturales, así como las propiedades conmutativa y asociativa de la multiplicación',
    'primaria-5': 'de adición, sustracción, multiplicación y división con números naturales',
    'primaria-6': 'de adición, sustracción, multiplicación y división de dos números naturales',
  },
  doblesMitades: {
    'primaria-1': 'Estrategias de cálculo mental, como la suma de cifras iguales',
    'primaria-2': 'el doble y la mitad, con números de hasta dos cifras',
    'primaria-3': 'duplicar o dividir por 2',
    'primaria-4': 'doblar y dividir por 2 de forma reiterada',
  },
  combinadas: {
    'primaria-5': 'la relación entre las cuatro operaciones y sus propiedades (conmutativa, asociativa y distributiva)',
    'primaria-6': 'Procedimientos y recursos para realizar operaciones con números naturales',
    'secundaria-1': 'Usa este entendimiento para asociar o secuenciar operaciones',
  },
  fraccionParteTodo: {
    'primaria-4': 'La fracción como parte-todo (cantidad discreta o continua)',
    'primaria-5': 'La fracción como parte de una cantidad discreta o continua',
    'primaria-6': 'acciones de dividir una o más unidades en partes iguales y las transforma en expresiones numéricas (modelo) de fracciones',
  },
  fraccionesEquivalentes: {
    'primaria-4': 'así como equivalencias y operaciones de adición y sustracción entre fracciones usuales usando fracciones equivalentes',
    'primaria-5': 'amplificación y simplificación de fracciones',
    'primaria-6': 'la amplificación y simplificación de fracciones',
  },
  fraccionOperador: {
    'primaria-4': 'La fracción como parte-todo (cantidad discreta o continua)',
    'primaria-5': 'La fracción como parte de una cantidad discreta o continua y como operador',
    'primaria-6': 'La fracción como operador y como cociente',
  },
  operarFracciones: {
    'primaria-4': 'operaciones de adición y sustracción entre fracciones usuales usando fracciones equivalentes',
    'primaria-5': 'Las operaciones de adición y sustracción con números decimales y fracciones',
    'primaria-6': 'las operaciones de adición, sustracción y multiplicación con fracciones y decimales',
    'secundaria-1': 'para realizar operaciones con números enteros, expresiones fraccionarias, decimales y porcentuales',
  },
  decimales: {
    'primaria-5': 'y de adición y sustracción con decimales',
    'primaria-6': 'adición, sustracción y multiplicación con expresiones fraccionarias y decimales (hasta el centésimo)',
    'secundaria-1': 'para realizar operaciones con números enteros, expresiones fraccionarias, decimales y porcentuales',
  },
  porcentajes: {
    'primaria-6': 'calcular porcentajes usuales',
    'secundaria-1': 'para realizar operaciones con números enteros, expresiones fraccionarias, decimales y porcentuales',
    'secundaria-2': 'para realizar operaciones con números enteros, expresiones fraccionarias, decimales y porcentuales',
  },
  potencias: {
    'primaria-6': 'y en potencias cuadradas y cúbicas',
    'secundaria-1': 'y radicación y potenciación con números enteros, y sus propiedades',
    'secundaria-2': 'y potencias con exponente entero',
  },
  raices: {
    'secundaria-1': 'y radicación y potenciación con números enteros',
    'secundaria-2': 'Plantea afirmaciones sobre las propiedades de la potenciación y la radicación',
  },
  ecuaciones: {
    'primaria-4': 'de la igualdad (con un término desconocido)',
    'primaria-5': 'ecuaciones simples (por ejemplo: x + a = b) con números naturales',
    'primaria-6': 'las transforma en ecuaciones que contienen las cuatro operaciones',
    'secundaria-1': 'a ecuaciones lineales (ax + b = cx + d, a y c ∈ Z)',
    'secundaria-2': 'a ecuaciones lineales (ax + b = cx + d, a y c ∈ Q)',
  },
  enteros: {
    'secundaria-1': 'operaciones de adición, sustracción, multiplicación, división con números enteros',
    'secundaria-2': 'operaciones de adición, sustracción, multiplicación, división con números enteros',
  },
  tiempo: {
    'primaria-4': 'el tiempo (año, hora, media hora y cuarto de hora)',
    'primaria-5': 'para hacer conversiones de unidades de masa y tiempo',
    'primaria-6': 'para hacer conversiones de unidades de masa, tiempo y temperatura',
  },
  longitud: {
    'primaria-3': 'las medidas de longitudes de un mismo objeto con diferentes unidades',
    'primaria-4': 'y hace conversiones de unidades de longitud',
    'primaria-5': 'realiza conversiones de unidades de longitud mediante cálculos numéricos',
    'primaria-6': 'Realiza cálculos numéricos para hacer conversiones de medidas (unidades de longitud)',
  },
  masa: {
    'primaria-4': 'Mide, estima y compara la masa (kilogramo, gramo)',
    'primaria-5': 'para hacer conversiones de unidades de masa y tiempo',
    'primaria-6': 'para hacer conversiones de unidades de masa, tiempo y temperatura',
  },
  capacidad: {
    'primaria-4': 'la medida de capacidad de los recipientes para determinar cuántas veces se puede llenar uno con el otro',
    'primaria-5': 'sobre la medida de capacidad de los recipientes',
  },
} satisfies Record<string, Citas>
