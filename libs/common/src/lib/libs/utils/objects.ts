export function removeCircularReferences(obj: any, seen = new WeakSet()): any {
  // Проверяем, является ли объект объектом
  if (typeof obj === 'object' && obj !== null) {
    // Если объект уже был виден, значит, есть циклическая ссылка
    if (seen.has(obj)) {
      return undefined; // Удаляем циклическую ссылку
    }
    seen.add(obj); // Добавляем объект в множество "виденных" объектов

    // Рекурсивно вызываем функцию для всех свойств объекта
    for (const key in obj) {
      obj[key] = removeCircularReferences(obj[key], seen);
    }
  }

  return obj; // Возвращаем объект без циклических ссылок
}
