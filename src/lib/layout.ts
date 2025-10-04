export function getLayoutParams() {
  const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  return {
    debug: q.has('debugLayout'),
    fw: Number(q.get('fw')) || null, // content max width override (px)
    fh: Number(q.get('fh')) || null, // field height override (px)
    benchCols: Number(q.get('benchCols')) || null // desktop bench columns override
  };
}