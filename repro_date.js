
const m = '12';
console.log("String Parse '2000-12-01':", new Date(`2000-${m}-01`).toString());
console.log("Constructor(2000, 11, 1):", new Date(2000, parseInt(m) - 1, 1).toString());
console.log("Locale String (String Parse):", new Date(`2000-${m}-01`).toLocaleString('es-CR', { month: 'long' }));
console.log("Locale String (Constructor):", new Date(2000, parseInt(m) - 1, 1).toLocaleString('es-CR', { month: 'long' }));
