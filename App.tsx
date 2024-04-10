import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Alert,
  Pressable,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './src/components/Header';
import ControlPresupuesto from './src/components/ControlPresupuesto';
import FormularioGasto from './src/components/FormularioGasto';
import ListadoGastos from './src/components/ListadoGastos';
import Filtro from './src/components/Filtro';
import { generarId } from './src/helpers';
import NuevoPresupesto from './src/components/NuevoPresupesto';

interface Gasto {
  id: number;
  nombre: string;
  categoria: string;
  cantidad: number;
  fecha: number;
}

const App: React.FC = () => {
  const [isValidPresupuesto, setIsValidPresupuesto] = useState<boolean>(false);
  const [presupuesto, setPresupuesto] = useState<number>(0);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [modal, setModal] = useState<boolean>(false);
  const [gasto, setGasto] = useState<Gasto>({ id: 0, nombre: '', categoria: '', cantidad: 0, fecha: 0 });
  const [filtro, setFiltro] = useState<string>('');
  const [gastosFiltrados, setGastosFiltrados] = useState<Gasto[]>([]);

  useEffect(() => {
    const obtenerPresupuestoStorage = async (): Promise<void> => {
      try {
        const presupuestoStorage = await AsyncStorage.getItem('planificador_presupuesto') ?? '0';
        const presupuestoValue = Number(presupuestoStorage);
        if (presupuestoValue > 0) {
          setPresupuesto(presupuestoValue);
          setIsValidPresupuesto(true);
        }
      } catch (error) {
        console.log(error);
      }
    };
    obtenerPresupuestoStorage();
  }, []);

  useEffect(() => {
    if (isValidPresupuesto) {
      const guardarPresupuestoStorage = async (): Promise<void> => {
        try {
          await AsyncStorage.setItem('planificador_presupuesto', String(presupuesto));
        } catch (error) {
          console.log(error);
        }
      };
      guardarPresupuestoStorage();
    }
  }, [isValidPresupuesto, presupuesto]);

  useEffect(() => {
    const obtenerGastosStorage = async (): Promise<void> => {
      try {
        const gastosStorage = await AsyncStorage.getItem('planificador_gastos');
        if (gastosStorage) {
          setGastos(JSON.parse(gastosStorage));
        }
      } catch (error) {
        console.log(error);
      }
    };
    obtenerGastosStorage();
  }, []);

  useEffect(() => {
    const guardarGastosStorage = async (): Promise<void> => {
      try {
        await AsyncStorage.setItem('planificador_gastos', JSON.stringify(gastos));
      } catch (error) {
        console.log(error);
      }
    };
    guardarGastosStorage();
  }, [gastos]);

  const handleNuevoPresupuesto = (nuevoPresupuesto: number): void => {
    if (nuevoPresupuesto > 0) {
      setIsValidPresupuesto(true);
    } else {
      Alert.alert('Error', 'El presupuesto no puede ser menor o igual a 0', [{ text: 'OK' }]);
    }
  };

  const handleGasto = (nuevoGasto: Gasto): void => {
    if ([nuevoGasto.nombre, nuevoGasto.categoria, nuevoGasto.cantidad.toString()].includes('')) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    if (nuevoGasto.id) {
      const gastosActualizados = gastos.map(gastoState => (gastoState.id === nuevoGasto.id ? nuevoGasto : gastoState));
      setGastos(gastosActualizados);
    } else {
      nuevoGasto.id = parseFloat(generarId()); // Convertir a número usando parseFloat()
      nuevoGasto.fecha = Date.now();
      setGastos([...gastos, nuevoGasto]);
    }
    

    setModal(!modal);
  };

  const eliminarGasto = (id: number): void => {
    Alert.alert(
      '¿Deseas eliminar el gasto?',
      'Un gasto eliminado no se puede recuperar',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Si, Eliminar',
          onPress: () => {
            const gastosActualizados = gastos.filter(gastoState => gastoState.id !== id);
            setGastos(gastosActualizados);
            setModal(!modal);
            setGasto({ id: 0, nombre: '', categoria: '', cantidad: 0, fecha: 0 });
          },
        },
      ]
    );
  };

  const resetearApp = async (): Promise<void> => {
    Alert.alert(
      '¿Deseas Resetear la App?',
      'Esto eliminará presupuesto y gastos',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Si, Resetear',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setIsValidPresupuesto(false);
              setPresupuesto(0);
              setGastos([]);
            } catch (error) {
              console.log(error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.contenedor}>
      <ScrollView>
        <View style={styles.header}>
          <Header />
          {isValidPresupuesto ? (
            <ControlPresupuesto
              presupuesto={presupuesto}
              gastos={gastos}
              resetearApp={resetearApp}
            />
          ) : (
            <NuevoPresupesto
              presupuesto={presupuesto}
              setPresupuesto={setPresupuesto}
              handleNuevoPresupuesto={handleNuevoPresupuesto}
            />
          )}
        </View>

        {isValidPresupuesto && (
          <>
            <Filtro
              filtro={filtro}
              setFiltro={setFiltro}
              gastos={gastos}
              setGastosFiltrados={setGastosFiltrados}
            />
            <ListadoGastos
              gastos={gastos}
              setModal={setModal}
              setGasto={setGasto}
              filtro={filtro}
              gastosFiltrados={gastosFiltrados}
            />
          </>
        )}
      </ScrollView>

      {modal && (
        <Modal
          animationType='slide'
          visible={modal}
        >
          <FormularioGasto
            setModal={setModal}
            handleGasto={handleGasto}
            gasto={gasto}
            setGasto={setGasto}
            eliminarGasto={eliminarGasto}
          />
        </Modal>
      )}

      {isValidPresupuesto && (
        <Pressable
          style={styles.pressable}
          onPress={() => setModal(!modal)}
        >
          <Image
            style={styles.imagen}
            source={require('./src/img/nuevo-gasto.png')}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: '#F5F5F5',
    flex: 1,
  },
  header: {
    backgroundColor: '#3B82F6',
    minHeight: 400,
  },
  pressable: {
    width: 60,
    height: 60,
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  imagen: {
    width: 60,
    height: 60,
  },
});

export default App;
