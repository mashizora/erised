export function createBurnPattern() {
  const ignition = Math.random();
  const slope = (Math.random() - 0.5) * 0.24;
  const ripple = Math.random() * Math.PI * 2;
  const drift = (Math.random() - 0.5) * 0.32;
  const columns = Array.from({ length: 33 }, (_, i) => ({
    x: -0.1 + 1.2 * i / 32,
    roughness: (Math.random() - 0.5) * 0.04,
  }));

  // 各段火线沿着同一组横坐标变形，纸边和炭痕共享每一个中间帧。
  const frames = [1.26, 0.99, 0.69, 0.37, 0.09, -0.27].map((height, frame) =>
    columns.map(({ x, roughness }) => {
      const distance = (x - ignition - drift * frame / 5) / 0.23;
      const notch = -0.17 * Math.exp(-distance * distance);
      return height + notch + slope * (x - ignition) + roughness
        + 0.037 * Math.sin(11 * x + ripple + frame * 0.8)
        + 0.021 * Math.sin(26 * x - ripple - frame * 1.2);
    })
  );

  const paths = frames.map((ys) => {
    const points = columns.map(({ x }, i) => `${x.toFixed(3)} ${ys[i].toFixed(3)}`);
    return `M${points.join(" L")} V-2 H-0.1 Z`;
  });

  const embers = Array.from({ length: 6 }, (_, i) => {
    const column = 4 + i * 4 + Math.floor(Math.random() * 4);
    const gap = 0.02 + Math.random() * 0.065;
    return {
      x: columns[column].x,
      heights: frames.map((ys) => (ys[column] + gap).toFixed(3)).join(";"),
      radius: 0.0025 + Math.random() * 0.003,
    };
  });
  return { paths, embers, grainSeed: Math.floor(Math.random() * 65536) };
}
