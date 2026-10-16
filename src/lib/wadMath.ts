// bigint ports of WadExp.expWad and WadExp.lnWad (solady FixedPointMathLib, same commit as the
// contracts), reproducing the EVM's 256-bit wrapping arithmetic so results match the chain bit
// for bit. Every intermediate is kept as an unsigned 256-bit word, as the EVM does.

const ZERO = BigInt(0);
const ONE = BigInt(1);
const MOD = BigInt(2) ** BigInt(256);
const HALF = BigInt(2) ** BigInt(255);
const BYTE_MASK = BigInt(0xff);

const u = (x: bigint): bigint => ((x % MOD) + MOD) % MOD;
const s = (x: bigint): bigint => { const v = u(x); return v >= HALF ? v - MOD : v; };
const add = (a: bigint, b: bigint): bigint => u(a + b);
const sub = (a: bigint, b: bigint): bigint => u(a - b);
const mul = (a: bigint, b: bigint): bigint => u(a * b);
const sdiv = (a: bigint, b: bigint): bigint => u(s(a) / s(b));
const shl = (n: bigint, x: bigint): bigint => u(u(x) << n);
const shr = (n: bigint, x: bigint): bigint => u(x) >> n;
const sar = (n: bigint, x: bigint): bigint => u(s(x) >> n);
const lt = (a: bigint, b: bigint): bigint => (u(a) < u(b) ? ONE : ZERO);
const byte = (i: bigint, w: bigint): bigint => (u(w) >> ((BigInt(31) - i) * BigInt(8))) & BYTE_MASK;

export class ExpOverflow extends Error {}
export class LnWadUndefined extends Error {}

// exp(x) in WAD. Throws where the contract reverts.
export function expWad(xIn: bigint): bigint {
  if (xIn <= BigInt("-41446531673892822313")) return ZERO;
  if (xIn >= BigInt("135305999368893231589")) throw new ExpOverflow();

  let x = sdiv(shl(BigInt(78), xIn), BigInt(5) ** BigInt(18));

  const LN2_96 = BigInt("54916777467707473351141471128");
  const k = sar(BigInt(96), add(sdiv(shl(BigInt(96), x), LN2_96), BigInt(2) ** BigInt(95)));
  x = sub(x, mul(k, LN2_96));

  let y = add(x, BigInt("1346386616545796478920950773328"));
  y = add(sar(BigInt(96), mul(y, x)), BigInt("57155421227552351082224309758442"));
  let p = sub(add(y, x), BigInt("94201549194550492254356042504812"));
  p = add(sar(BigInt(96), mul(p, y)), BigInt("28719021644029726153956944680412240"));
  p = add(mul(p, x), shl(BigInt(96), BigInt("4385272521454847904659076985693276")));

  let q = sub(x, BigInt("2855989394907223263936484059900"));
  q = add(sar(BigInt(96), mul(q, x)), BigInt("50020603652535783019961831881945"));
  q = sub(sar(BigInt(96), mul(q, x)), BigInt("533845033583426703283633433725380"));
  q = add(sar(BigInt(96), mul(q, x)), BigInt("3604857256930695427073651918091429"));
  q = sub(sar(BigInt(96), mul(q, x)), BigInt("14423608567350463180887372962807573"));
  q = add(sar(BigInt(96), mul(q, x)), BigInt("26449188498355588339934803723976023"));

  const r = sdiv(p, q);
  return s(shr(BigInt(195) - s(k), mul(r, BigInt("3822833074963236453042738258902158003155416615667"))));
}

// ln(x) in WAD. Throws where the contract reverts (x <= 0).
export function lnWad(xIn: bigint): bigint {
  if (xIn <= ZERO) throw new LnWadUndefined();
  let x = u(xIn);

  let r = shl(BigInt(7), lt(BigInt("0xffffffffffffffffffffffffffffffff"), x));
  r |= shl(BigInt(6), lt(BigInt("0xffffffffffffffff"), shr(r, x)));
  r |= shl(BigInt(5), lt(BigInt("0xffffffff"), shr(r, x)));
  r |= shl(BigInt(4), lt(BigInt("0xffff"), shr(r, x)));
  r |= shl(BigInt(3), lt(BigInt("0xff"), shr(r, x)));
  r ^= byte(
    shr(shr(r, x), BigInt("0x8421084210842108cc6318c6db6d54be")) & BigInt(0x1f),
    BigInt("0xf8f9f9faf9fdfafbf9fdfcfdfafbfcfef9fafdfafcfcfbfefafafcfbffffffff"),
  );

  x = shr(BigInt(159), shl(r, x));

  let p = sar(BigInt(96), mul(add(BigInt("3273285459638523848632254066296"), x), x));
  p = sar(BigInt(96), mul(add(BigInt("24828157081833163892658089445524"), p), x));
  p = sar(BigInt(96), mul(add(BigInt("43456485725739037958740375743393"), p), x));
  p = sub(p, BigInt("11111509109440967052023855526967"));
  p = sub(sar(BigInt(96), mul(p, x)), BigInt("45023709667254063763336534515857"));
  p = sub(sar(BigInt(96), mul(p, x)), BigInt("14706773417378608786704636184526"));
  p = sub(mul(p, x), shl(BigInt(96), BigInt("795164235651350426258249787498")));

  let q = add(BigInt("5573035233440673466300451813936"), x);
  q = add(BigInt("71694874799317883764090561454958"), sar(BigInt(96), mul(x, q)));
  q = add(BigInt("283447036172924575727196451306956"), sar(BigInt(96), mul(x, q)));
  q = add(BigInt("401686690394027663651624208769553"), sar(BigInt(96), mul(x, q)));
  q = add(BigInt("204048457590392012362485061816622"), sar(BigInt(96), mul(x, q)));
  q = add(BigInt("31853899698501571402653359427138"), sar(BigInt(96), mul(x, q)));
  q = add(BigInt("909429971244387300277376558375"), sar(BigInt(96), mul(x, q)));

  p = sdiv(p, q);
  p = mul(BigInt("1677202110996718588342820967067443963516166"), p);
  p = add(mul(BigInt("16597577552685614221487285958193947469193820559219878177908093499208371"), sub(BigInt(159), r)), p);
  p = add(BigInt("600920179829731861736702779321621459595472258049074101567377883020018308"), p);
  return s(sar(BigInt(174), p));
}
