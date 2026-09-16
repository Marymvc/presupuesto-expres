const { test } = require('node:test');
const assert = require('node:assert');
const { numeroALetras } = require('../src/utils/numeroALetras');

test('convierte un monto con centavos al formato boliviano', () => {
  assert.strictEqual(
    numeroALetras(43823.15),
    'Cuarenta y tres mil ochocientos veintitres 15/100 Bolivianos'
  );
});

test('convierte un monto exacto de tu ejemplo real (M01)', () => {
  assert.strictEqual(
    numeroALetras(8579.35),
    'Ocho mil quinientos setenta y nueve 35/100 Bolivianos'
  );
});

test('convierte cero correctamente', () => {
  assert.strictEqual(numeroALetras(0), 'Cero 00/100 Bolivianos');
});

test('convierte un monto sin centavos', () => {
  assert.strictEqual(numeroALetras(100), 'Cien 00/100 Bolivianos');
});
