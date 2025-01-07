{/* Todo el código exactamente igual que proporcionaste, solo cambiando los textos de los botones */}
import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, Trash2, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

const USERS = [
  { id: 'ETS', name: 'ETS' },
  { id: 'TUL', name: 'TUL' },
  { id: 'TSD', name: 'TSD' },
  { id: 'VMM', name: 'VMM' }
];

const SavingsTracker = () => {
  const [currentUser, setCurrentUser] = useState(USERS[0].id);
  const [usedNumbers, setUsedNumbers] = useState(new Set());
  const [currentRandomDay, setCurrentRandomDay] = useState(null);
  const [savedDays, setSavedDays] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // Cargar datos al cambiar de usuario
  useEffect(() => {
    const savedData = localStorage.getItem(`savings-${currentUser}`);
    if (savedData) {
      const { days, numbers } = JSON.parse(savedData);
      setSavedDays(days);
      setUsedNumbers(new Set(numbers));
    } else {
      // Generar 4 números aleatorios iniciales para usuarios nuevos
      const initialNumbers = new Set();
      while(initialNumbers.size < 4) {
        initialNumbers.add(Math.floor(Math.random() * 365) + 1);
      }
      
      const initialDays = Array.from(initialNumbers).map((num, index) => ({
        id: index + 1,
        dayNumber: num,
        date: new Date(2024, 0, index + 1),
        completed: false
      }));

      setSavedDays(initialDays);
      setUsedNumbers(initialNumbers);
      saveToLocalStorage(initialDays, Array.from(initialNumbers));
    }
  }, [currentUser]);

  // Guardar datos en localStorage
  const saveToLocalStorage = (days, numbers) => {
    localStorage.setItem(`savings-${currentUser}`, JSON.stringify({
      days,
      numbers
    }));
  };

  const generateUniqueRandomNumber = () => {
    if (usedNumbers.size >= 365) {
      return null;
    }

    let randomNum;
    do {
      randomNum = Math.floor(Math.random() * 365) + 1;
    } while (usedNumbers.has(randomNum));

    return randomNum;
  };

  const addNewDay = () => {
    const today = new Date().toDateString();
    if (savedDays.some(day => new Date(day.date).toDateString() === today)) {
      setShowAlert({ type: 'error', message: 'Ya has generado un número para hoy' });
      return;
    }

    const randomNum = generateUniqueRandomNumber();
    if (!randomNum) {
      setShowAlert({ type: 'warning', message: '¡Has utilizado todos los días del año!' });
      return;
    }

    setCurrentRandomDay(randomNum);
    const now = new Date();
    const newDay = {
      id: Date.now(),
      dayNumber: randomNum,
      date: now,
      completed: false
    };

    const newDays = [...savedDays, newDay];
    const newNumbers = new Set([...usedNumbers, randomNum]);
    
    setSavedDays(newDays);
    setUsedNumbers(newNumbers);
    saveToLocalStorage(newDays, Array.from(newNumbers));
    setShowAlert(null);
  };

  const addSpecificDate = (e) => {
    e.preventDefault();
    if (!selectedDate) return;

    const selectedDateTime = new Date(selectedDate + 'T12:00:00');

    // Verificar si la fecha ya existe
    const dateExists = savedDays.some(day => {
      const existingDate = new Date(day.date);
      return existingDate.getFullYear() === selectedDateTime.getFullYear() &&
             existingDate.getMonth() === selectedDateTime.getMonth() &&
             existingDate.getDate() === selectedDateTime.getDate();
    });

    if (dateExists) {
      setShowAlert({ type: 'error', message: 'Ya existe una entrada para esta fecha' });
      return;
    }

    const randomNum = generateUniqueRandomNumber();
    if (!randomNum) {
      setShowAlert({ type: 'warning', message: '¡Has utilizado todos los días del año!' });
      return;
    }

    const newDay = {
      id: Date.now(),
      dayNumber: randomNum,
      date: selectedDateTime,
      completed: false
    };

    // Insertar en orden cronológico
    const newDays = [...savedDays];
    const insertIndex = newDays.findIndex(day => {
      const dayDate = new Date(day.date);
      return dayDate > selectedDateTime;
    });
    
    if (insertIndex === -1) {
      newDays.push(newDay);
    } else {
      newDays.splice(insertIndex, 0, newDay);
    }

    const newNumbers = new Set([...usedNumbers, randomNum]);
    
    setSavedDays(newDays);
    setUsedNumbers(newNumbers);
    saveToLocalStorage(newDays, Array.from(newNumbers));
    setSelectedDate('');
    setShowDatePicker(false);
    setShowAlert({ type: 'success', message: `Añadido día para ${formatDate(selectedDateTime)}` });
    setTimeout(() => setShowAlert(null), 3000);
  };

  const toggleCompletion = (id) => {
    const newDays = savedDays.map(day => {
      if (day.id === id) {
        return { ...day, completed: !day.completed };
      }
      return day;
    });
    
    setSavedDays(newDays);
    saveToLocalStorage(newDays, Array.from(usedNumbers));
  };

  const deleteEntry = (id, dayNumber) => {
    const newDays = savedDays.filter(day => day.id !== id);
    const newNumbers = new Set(usedNumbers);
    newNumbers.delete(dayNumber);

    setSavedDays(newDays);
    setUsedNumbers(newNumbers);
    saveToLocalStorage(newDays, Array.from(newNumbers));
    
    if (currentRandomDay === dayNumber) {
      setCurrentRandomDay(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Calcular la suma total solo de días completados
  const totalSum = savedDays
    .filter(day => day.completed)
    .reduce((sum, day) => sum + day.dayNumber, 0);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Seguimiento de Ahorro Diario
            </CardTitle>
            <select
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              {USERS.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {currentRandomDay && (
              <div className="text-center bg-blue-50 p-6 rounded-lg">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  Hoy ${currentRandomDay}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <button
                onClick={addNewDay}
                disabled={usedNumbers.size >= 365}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-lg"
              >
                <Calendar className="h-6 w-6" />
                Generar ahorro de hoy
              </button>

              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-lg"
              >
                <Clock className="h-6 w-6" />
                Añadir fecha anterior
              </button>
            </div>

            {showDatePicker && (
              <form onSubmit={addSpecificDate} className="flex gap-4 items-center justify-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-4 py-2 border rounded-lg"
                  required
                />
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Añadir
                </button>
              </form>
            )}

            {showAlert && (
              <Alert className={`${
                showAlert.type === 'error' 
                  ? 'bg-red-50 border-red-200' 
                  : showAlert.type === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
              }`}>
                <AlertDescription>
                  {showAlert.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {savedDays.length}
                </div>
                <div className="text-sm text-gray-600">Días Generados</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  ${totalSum}
                </div>
                <div className="text-sm text-gray-600">Suma Total</div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Historial:</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 max-h-96 overflow-y-auto">
                {savedDays
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map((day) => (
                  <div 
                    key={day.id} 
                    className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleCompletion(day.id)}
                        className={`p-2 rounded-full transition-colors duration-200 ${
                          day.completed 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {day.completed ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                      </button>
                      <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                        #{day.dayNumber}
                      </div>
                      <div className="font-medium">
                        {formatDate(day.date)}
                      </div>
                      <button
                        onClick={() => deleteEntry(day.id, day.dayNumber)}
                        className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsTracker;