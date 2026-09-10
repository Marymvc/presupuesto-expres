// Convierte un número (con centavos) a su representación en letras,
// en español, formato boliviano: "Cuarenta y tres mil ochocientos
// veintitrés 15/100 Bolivianos" — igual al pie de un presupuesto real.

const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DECENAS = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const DECENAS_2 = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

// Convierte un número de 0 a 999 a letras.
function convertirGrupo(numero) {
  if (numero === 0) return '';
  if (numero === 100) return 'cien';

  if (numero < 10) return UNIDADES[numero];
  if (numero < 20) return DECENAS[numero - 10];
  if (numero < 30) return numero === 20 ? 'veinte' : `veinti${UNIDADES[numero - 20]}`;
  if (numero < 100) {
    const d = Math.floor(numero / 10);
    const u = numero % 10;
    return u === 0 ? DECENAS_2[d] : `${DECENAS_2[d]} y ${UNIDADES[u]}`;
  }

  const c = Math.floor(numero / 100);
  const resto = numero % 100;
  return `${CENTENAS[c]}${resto > 0 ? ' ' + convertirGrupo(resto) : ''}`;
}

// Convierte un entero (sin decimales) completo, separando millones / miles / resto.
function convertirEntero(numero) {
  if (numero === 0) return 'cero';

  const partes = [];

  const millones = Math.floor(numero / 1000000);
  numero %= 1000000;
  const miles = Math.floor(numero / 1000);
  numero %= 1000;
  const resto = numero;

  if (millones > 0) {
    partes.push(millones === 1 ? 'un millón' : `${convertirGrupo(millones)} millones`);
  }
  if (miles > 0) {
    partes.push(miles === 1 ? 'mil' : `${convertirGrupo(miles)} mil`);
  }
  if (resto > 0) {
    partes.push(convertirGrupo(resto));
  }

  return partes.join(' ').trim();
}

function numeroALetras(monto, moneda = 'Bolivianos') {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const centavosStr = String(centavos).padStart(2, '0');

  const enLetras = convertirEntero(entero);
  const capitalizado = enLetras.charAt(0).toUpperCase() + enLetras.slice(1);

  return `${capitalizado} ${centavosStr}/100 ${moneda}`;
}

module.exports = { numeroALetras };
