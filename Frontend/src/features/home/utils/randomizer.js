export function getRandomIndex(arrayLength, excludeIndex = null) {
  if (arrayLength === 0) return -1
  if (arrayLength === 1) return 0

  let index
  do {
    index = Math.floor(Math.random() * arrayLength)
  } while (index === excludeIndex)

  return index
}

export function getRandomItem(array, excludeIndex = null) {
  const index = getRandomIndex(array.length, excludeIndex)
  return { item: array[index], index }
}
