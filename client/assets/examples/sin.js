var x = source.getRandomValue(index * 2 + 0, Distribution.GAUSSIAN);
var z = source.getRandomValue(index * 2 + 1, Distribution.GAUSSIAN);

return [
    x * 0.2 + 0.5,
    (Math.sin(x * 1.2 + 0.8) + Math.sin(z * 1.2 + 0.8)) * 0.1 + 0.5,
    z * 0.2 + 0.5
];
