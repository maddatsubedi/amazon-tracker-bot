const obj = {
    name: 'test3',
    roll: 1
}

const getKey = (obj, value) => {
    return Object.keys(obj).find(key => obj[key] === value);
}

console.log(getKey(obj, 1));