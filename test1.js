const arr = [1, 2, 3, 4, 5, 5, 6, 1, 2, 2, 2, 3, 2];
let hashMap = {};

for (let i = 0; i < arr.length; i++) {
    hashMap[arr[i]] = hashMap[arr[i]] ? hashMap[arr[i]] + 1 : 1;
}

console.log(hashMap);