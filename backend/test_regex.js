const pattern = ' :*';
const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
console.log('escaped:', JSON.stringify(escaped));
const regex = new RegExp('^' + escaped + '$');
console.log('regex:', regex.toString());
console.log('test " : ":', regex.test(' : '));
console.log('test "other: :preserved":', regex.test('other: :preserved'));
