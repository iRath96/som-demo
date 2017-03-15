var a = source.getRandomValue(index * 2 + 0, Distribution.UNIFORM) * Math.PI * 2;
var b = source.getRandomValue(index * 2 + 1, Distribution.UNIFORM) * Math.PI * 2;

return [
    Math.cos(a) * Math.sin(b) * 0.5 + 0.5,
    Math.cos(b) * 0.5 + 0.5,
    Math.sin(a) * Math.sin(b) * 0.5 + 0.5
];
