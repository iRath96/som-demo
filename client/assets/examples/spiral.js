var t = index / source.sampleCount;
let n1 = source.getRandomValue(index * 3 + 0, Distribution.GAUSSIAN) * 0.02;
let n2 = source.getRandomValue(index * 3 + 1, Distribution.GAUSSIAN) * 0.02;
let n3 = source.getRandomValue(index * 3 + 2, Distribution.GAUSSIAN) * 0.02;

return [
    Math.cos(t * 8) * t * 0.5 + 0.5 + n1,
    0.5 + n2,
    Math.sin(t * 8) * t * 0.5 + 0.5 + n3
];