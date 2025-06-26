import { ref } from 'vue'

export default function useLocalStorage(key, initialValue) {
  const storedValue = ref(initialValue)
  
  try {
    const item = window.localStorage.getItem(key)
    storedValue.value = item ? JSON.parse(item) : initialValue
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error)
  }

  const setValue = (value) => {
    try {
      storedValue.value = value
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  const deleteItem = () => {
    try {
      window.localStorage.removeItem(key)
      storedValue.value = null
    } catch (error) {
      console.error(`Error deleting localStorage key "${key}":`, error)
    }
  }

  const clear = () => {
    try {
      window.localStorage.clear()
      storedValue.value = initialValue
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }

  return { storedValue, setValue, deleteItem, clear }
}