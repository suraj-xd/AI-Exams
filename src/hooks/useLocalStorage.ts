import { useState, useEffect } from "react";
function isBrowser() {
  return typeof window !== "undefined";
}

function useLocalStorage(key: string, initialValue: any = ""): any {
  const [hasMounted, setHasMounted] = useState(false);
  const [value, setValu] = useState(initialValue);

  function setValue(newValue: any) {
    setValu(newValue);
  }
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleStorageChange = (e: any) => {
    if (e.key === key) {
      setValue(JSON.parse(e.newValue));
    }
  };

  useEffect(() => {
    if (hasMounted) {
      window.addEventListener("storage", handleStorageChange);
      const storedValue = window.localStorage.getItem(key);
      if (storedValue) {
        setValue(JSON.parse(storedValue));
      }
    }
  }, [hasMounted]);

  useEffect(() => {
    return () => {
      if (isBrowser()) {
        window.removeEventListener("storage", handleStorageChange);
      }
    };
  }, [key]);

  const setSynchronizedValue = (newValue: any) => {
    setValue(newValue);
    window.localStorage?.setItem(key, JSON.stringify(newValue));
  };

  return [value, setSynchronizedValue];
}

export default useLocalStorage;
