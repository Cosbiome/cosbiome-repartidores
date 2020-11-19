import React, { useEffect, useState } from "react";
import {
  Container,
  Text,
  List,
  ListItem,
  Left,
  Right,
  Body,
  Content,
  Button,
  Input,
  Icon,
} from "native-base";

import AsyncStorage from "@react-native-community/async-storage";
import { ScrollView, Alert } from "react-native";
import { http } from "../libs/http";
import { parseFirebaseNorm } from "../utils/asignarForFirebase";
import { socketIo } from "../utils/socketIo";

const ListRepartidor = (props) => {
  const [prueba, setPrueba] = useState({ data: { repartidores: [] } });
  const [view, setView] = useState(true);
  const [details, setDetails] = useState({});
  const [indexRep, setIndexRep] = useState(0);
  const [firmaCliente, setFirmaCliente] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [telefonovue, setTelefonoVue] = useState("false");

  useEffect(() => {
    handleFetchGet();
  }, []);

  // useEffect(() => {
  //   console.log(prueba);
  //   console.log(indexRep);
  //   console.log(details);
  // }, [prueba, indexRep, details]);

  const handleFetchGet = async () => {
    let fecha;
    if (new Date().getDate() < 10) {
      fecha = `${new Date().getFullYear()}-${
        new Date().getMonth() + 1
      }-0${new Date().getDate()}`;
    } else {
      fecha = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${
        new Date().getDate() - 1
      }`;
    }

    console.log(fecha);

    let rutaB = await http.get(`rutas/?fecha=${fecha}`);

    console.log(rutaB[0]);
    parseFirebaseNorm(rutaB[0], setPrueba);

    let nombre = await AsyncStorage.getItem("nombre");
    let index = rutaB[0].repartidores.findIndex(
      (rep) => rep.nombreRepartidor === nombre
    );
    let telvue = await AsyncStorage.getItem("telefono");
    setIndexRep(index);

    setTelefonoVue(telvue);
    socketIo.on("rutasAviso", (res) => {
      console.log(res);
      parseFirebaseNorm(res, setPrueba);
      setIndexRep(index);
    });
    // firestore()
    //   .collection("rutas")
    //   .where("fecha", "==", fecha)
    //   .onSnapshot(async (a) => {
    //     let nombre = await AsyncStorage.getItem("nombre");

    //     console.log(a, fecha);

    //     setPrueba({ id: a.docs[0].id, data: a.docs[0].data() });

    //     let index = a.docs[0]
    //       .data()
    //       .repartidores.findIndex((rep) => rep.nombreRepartidor === nombre);

    //     setIndexRep(index);
    //   });
  };

  const handleClick = async (idPedido) => {
    setView(false);
    let detailData = prueba.data.repartidores[indexRep].pedidos.filter(
      (ped) => ped.id === idPedido
    )[0];
    let arrayTotalProds = prueba.data.repartidores[indexRep].pedidos
      .filter((ped) => ped.id === idPedido)[0]
      .data.producto.map((a) => parseInt(a.cantidad));
    let sumaTotalProds = arrayTotalProds.reduce((a, b) => a + b);
    detailData.data.totalProductosPedido = sumaTotalProds;
    setDetails(detailData);
  };

  const handleConfirm = async () => {
    if (firmaCliente.length > 0) {
      let vendedorDatos = prueba.data.repartidores;
      vendedorDatos[indexRep] = {
        ...vendedorDatos[indexRep],
        pedidosEntregados:
          parseInt(vendedorDatos[indexRep].pedidosEntregados) + 1,
        dineroRecaudado:
          parseInt(vendedorDatos[indexRep].dineroRecaudado) +
          parseInt(details.data.total),
        porcentajeEntrega: `${(
          ((vendedorDatos[indexRep].pedidosEntregados + 1) * 100) /
          vendedorDatos[indexRep].totalPedidos
        ).toFixed(2)}%`,
        porcentajeDinero: `${(
          ((vendedorDatos[indexRep].dineroRecaudado +
            parseInt(details.data.total)) *
            100) /
          vendedorDatos[indexRep].totalRecaudado
        ).toFixed(2)}%`,
      };
      let indexPedido = vendedorDatos[indexRep].pedidos.findIndex(
        (a) => a.id === details.id
      );
      vendedorDatos[indexRep].pedidos[indexPedido].data.esperaRuta = false;
      vendedorDatos[indexRep].pedidos[
        indexPedido
      ].data.firmaCliente = firmaCliente;
      vendedorDatos[indexRep].pedidos[indexPedido].data.estatusPedido =
        "entregado";

      let rutaActualizar = await http.get("rutas/" + prueba.id);
      let dataRuta = rutaActualizar;

      await http.update("rutas/" + prueba.id, {
        repartidores: vendedorDatos,
        totalEntregados: parseInt(dataRuta.totalEntregados) + 1,
        dineroRecaudado:
          parseInt(dataRuta.dineroRecaudado) + parseInt(details.data.total),
        porcentajeEntrega: `${(
          ((parseInt(dataRuta.totalEntregados) + 1) * 100) /
          parseInt(dataRuta.totalPedidos)
        ).toFixed(2)}%`,
        porcentajeDinero: `${(
          ((parseInt(dataRuta.dineroRecaudado) + parseInt(details.data.total)) *
            100) /
          parseInt(dataRuta.totalRecaudado)
        ).toFixed(2)}%`,
      });
      await http.update("pedidos-rutas/" + details.id, {
        firmaCliente: firmaCliente,
        esperaRuta: false,
        estatusPedido: "entregado",
      });

      // let fecha = `${new Date().getFullYear()}-${
      //   new Date().getMonth() + details.data.totalProductosPedido - 1
      // }-${new Date().getDate()}`;
      // let readTime = new Date(fecha).getTime();

      let idCliente = await http.get(
        `clientes-soals/?idCliente=${details.data.idCliente}`
      );

      console.log(idCliente[0]?.pedidos);

      let schemaForUpdateClient = {
        pedidos:
          idCliente[0]?.pedidos !== undefined
            ? [
                ...idCliente[0]?.pedidos,
                {
                  fechaDeEntrega: new Date(),
                  dataPedido: details.data.producto,
                },
              ]
            : [
                {
                  fechaDeEntrega: new Date(),
                  dataPedido: details.data.producto,
                },
              ],
        ultimoPedido: {
          fechaDeEntrega: new Date(),
          dataPedido: details.data.producto,
        },
      };

      if (idCliente[0]?.id) {
        await http.update(
          `clientes-soals/${idCliente[0].id}`,
          schemaForUpdateClient
        );
      }

      // await firestore()
      //   .collection("pedidosClientes")
      //   .doc(details.data.idCliente)
      //   .set(
      //     {
      //       nombreCliente: details.data.nombreCliente,
      //       fechaEntrega: details.data.fechaEntrega,
      //       productosDelPedido: details.data.producto.map((a) => a.producto),
      //       totalProductos: details.data.totalProductosPedido,
      //       formaDePago: details.data.formaDePago,
      //       numTel: details.data.numTel,
      //       estatusPedido: "entregado",
      //       ciudad: details.data.ciudad,
      //       domicilio: details.data.domicilio,
      //       cruces: details.data.cruces,
      //       colonia: details.data.colonia,
      //       estadoProv: details.data.estadoProv,
      //       codigoPostal: details.data.codigoPostal,
      //       vendedor: details.data.vendedor,
      //       intentos: 0,
      //       enEspera: false,
      //       veriTime: readTime,
      //     },
      //     { merge: true }
      //   );

      setView(true);
      setDetails({});
      setFirmaCliente("");

      console.log(prueba.id);
      socketIo.emit("rutasMov", prueba.id);
    } else {
      alert("FIRMA DEL CLIENTE NECESARIA");
      console.log(details);
      console.log(details);
    }
  };

  const handleNotConfirm = () => {
    Alert.alert(
      "Confirma el regreso del pedido",
      "Presiona si para conpletar la devolucion",
      [
        { text: "si", onPress: () => handleDelete() },
        { text: "no", onPress: () => setCancelConfirm(false) },
      ]
    );
  };

  const handleDelete = async () => {
    let vendedorDatos = prueba.data.repartidores;
    vendedorDatos[indexRep] = {
      ...vendedorDatos[indexRep],
      pedidosNoEntregados: vendedorDatos[indexRep].pedidosNoEntregados + 1,
    };
    let indexPedido = vendedorDatos[indexRep].pedidos.findIndex(
      (a) => a.id === details.id
    );
    vendedorDatos[indexRep].pedidos[indexPedido].data.esperaRuta = false;
    vendedorDatos[indexRep].pedidos[indexPedido].data.estatusPedido =
      "cancelado";
    vendedorDatos[indexRep].pedidos[indexPedido].data.porcentajeEntrega = `${
      (vendedorDatos[indexRep].pedidosEntregados * 100) /
      vendedorDatos[indexRep].totalPedidos
    }%`;
    vendedorDatos[indexRep].pedidos[indexPedido].data.numTel1 =
      details.data.numTel;

    let rutaActualizar = await http.get("rutas/" + prueba.id);
    let dataRuta = rutaActualizar;

    details.data.producto.map(async (p) => {
      let data = await http.get(`productos/?nombreProducto=${p.producto}`);

      console.log(data[0].id);

      let cantidadNueva = data[0].cantidadProducto - p.cantidad;
      let apartadoNuevo =
        parseInt(data[0].productoApartado) + parseInt(p.cantidad);

      await http.update("productos/" + data[0].id, {
        cantidadProducto: cantidadNueva.toString(),
        productoApartado: apartadoNuevo.toString(),
      });
    });

    await http.update("rutas/" + prueba.id, {
      repartidores: vendedorDatos,
      totalNoEntregados: dataRuta.totalNoEntregados + 1,
    });
    await http.update("pedidos-rutas/" + details.id, {
      esperaRuta: false,
      estatusPedido: "cancelado",
    });
    await http.delete("pedidos-rutas/" + details.id);
    await http.post("preventa-calidads", details.data);

    setView(true);
    setDetails({});
    setFirmaCliente("");

    socketIo.emit("rutasMov", prueba.id);
    // console.log(vendedorDatos[indexRep].pedidos[indexPedido].numTel1);
  };

  const handleReg = () => {
    setView(true);
    setDetails({});
    setFirmaCliente("");
  };

  return (
    <Container>
      <ScrollView>
        {view ? (
          <List>
            {prueba.data.repartidores.length > 0 ? (
              prueba.data.repartidores[indexRep].pedidos.map((a, index) => {
                try {
                  console.log(a.data.de.split(":"));
                  let hora = new Date().getHours();
                  let minutos = new Date().getMinutes();
                  let horaFormatNew = a.data.de.split(":");
                  let horaFloat = parseFloat(
                    `${horaFormatNew[0]}.${horaFormatNew[1]}`
                  );
                  let horaFloat2 = parseFloat(`${hora}.${minutos}`);
                  let yellow15 = horaFloat - horaFloat2;

                  console.log(yellow15);
                  console.log(yellow15 > 0.45 && yellow15 < 0.55);
                } catch (error) {
                  alert("aaa");
                }

                let sem;
                if (horaFloat2 < horaFloat) {
                  sem = "green";
                } else {
                  sem = "red";
                }

                if (yellow15 > 0.45 && yellow15 < 0.55) {
                  sem = "yellow";
                } else {
                  sem = "red";
                }

                return a.data.esperaRuta ? (
                  <ListItem
                    key={a.id}
                    style={{
                      borderWidth: 2.0,
                      borderColor: sem,
                    }}
                    onPress={() => handleClick(a.id)}
                    itemHeader
                  >
                    <Left>
                      <Text style={{ fontSize: 11 }}>{a.data.idPedido}</Text>
                    </Left>
                    <Body>
                      <Text style={{ fontSize: 11 }}>
                        {a.data.nombreCliente}
                      </Text>
                    </Body>
                    <Right>
                      <Icon name="arrow-forward" />
                    </Right>
                  </ListItem>
                ) : a.data.estatusPedido === "entregado" ? (
                  <ListItem
                    key={a.id}
                    disabled={true}
                    style={{ backgroundColor: "green" }}
                    itemHeader
                  >
                    <Left>
                      <Text style={{ fontSize: 11, color: "white" }}>
                        {a.data.idPedido}
                      </Text>
                    </Left>
                    <Body>
                      <Text style={{ fontSize: 11, color: "white" }}>
                        {a.data.nombreCliente}
                      </Text>
                    </Body>
                    <Right>
                      <Text style={{ fontSize: 8, color: "white" }}>
                        {a.data.estatusPedido}
                      </Text>
                    </Right>
                  </ListItem>
                ) : (
                  <ListItem
                    key={a.id}
                    disabled={true}
                    style={{ backgroundColor: "red" }}
                    itemHeader
                  >
                    <Left>
                      <Text style={{ fontSize: 11, color: "white" }}>
                        {a.data.idPedido}
                      </Text>
                    </Left>
                    <Body>
                      <Text style={{ fontSize: 11, color: "white" }}>
                        {a.data.nombreCliente}
                      </Text>
                    </Body>
                    <Right>
                      <Text style={{ fontSize: 8, color: "white" }}>
                        {a.data.estatusPedido}
                      </Text>
                    </Right>
                  </ListItem>
                );
              })
            ) : (
              <ListItem>
                <Text>No hay pedidos</Text>
              </ListItem>
            )}
          </List>
        ) : (
          <>
            <Content>
              <List>
                <ListItem itemDivider>
                  <Left>
                    <Text>Detalles del pedido</Text>
                  </Left>
                  <Right>
                    <Text onPress={() => handleReg()}>Regresar</Text>
                  </Right>
                </ListItem>

                <ListItem>
                  <Text>{`Nombre cliente: ${details.data.nombreCliente}`}</Text>
                </ListItem>

                <ListItem>
                  {telefonovue === "false" ? (
                    <Text>Numero del cliente: 0000000000</Text>
                  ) : (
                    <Text>{`Numero cliente: ${details.data.numTel}`}</Text>
                  )}
                </ListItem>

                <ListItem>
                  <Text>{`Nombre vendedor: ${details.data.vendedor}`}</Text>
                </ListItem>

                <ListItem>
                  <Text>{`Nombre repartidor: ${details.data.repartidor}`}</Text>
                </ListItem>

                <ListItem>
                  <Text>{details.data.calidadEcha}</Text>
                </ListItem>

                <ListItem>
                  <Text>
                    {`Entrega de ${details.data.de} - ${details.data.a}`}
                  </Text>
                </ListItem>

                <ListItem>
                  <Text>{`Metodo de pago: ${details.data.formaDePago}`}</Text>
                </ListItem>

                <ListItem
                  style={{ backgroundColor: "white" }}
                  itemDivider
                ></ListItem>

                <ListItem itemDivider>
                  <Text>Detalles de entrega</Text>
                </ListItem>

                <ListItem>
                  <Text>{`Direccion: ${details.data.domicilio}`}</Text>
                </ListItem>

                <ListItem>
                  <Text>{`Cruces: ${details.data.cruces}`}</Text>
                </ListItem>

                <ListItem>
                  <Text>{`Colonia: ${details.data.colonia}`}</Text>
                </ListItem>

                <ListItem>
                  <Text>{`Estado: ${details.data.estadoProv}`}</Text>
                </ListItem>

                <ListItem>
                  <Text>{`Codigo postal: ${details.data.codigoPostal}`}</Text>
                </ListItem>

                <ListItem
                  style={{ backgroundColor: "white" }}
                  itemDivider
                ></ListItem>

                <ListItem itemDivider onPress={() => setView(true)}>
                  <Text>Productos del pedido</Text>
                </ListItem>
                <ListItem>
                  <Left>
                    <Text style={{ fontSize: 13 }}>PRODUCTO</Text>
                  </Left>
                  <Body>
                    <Text style={{ fontSize: 13 }}>CANTIDAD</Text>
                  </Body>
                  <Right>
                    <Text style={{ fontSize: 11 }}>PRECIO</Text>
                  </Right>
                </ListItem>

                {details.data.producto ? (
                  details.data.producto.map((prod, index) => {
                    return (
                      <ListItem key={index}>
                        <Left>
                          <Text>{prod.producto}</Text>
                        </Left>
                        <Body>
                          <Text> {prod.cantidad} </Text>
                        </Body>
                        <Right>
                          <Text> {prod.precio} </Text>
                        </Right>
                      </ListItem>
                    );
                  })
                ) : (
                  <ListItem>
                    <Text>No hay productos para este pedido</Text>
                  </ListItem>
                )}
                <ListItem itemDivider>
                  <Left>
                    <Text>TOTAL: </Text>
                  </Left>
                  <Body>
                    <Text> {details.data.totalProductosPedido} </Text>
                  </Body>
                  <Right>
                    <Text>{details.data.total}</Text>
                  </Right>
                </ListItem>

                <ListItem
                  style={{ backgroundColor: "white" }}
                  itemDivider
                ></ListItem>

                <ListItem itemDivider>
                  <Text>Confirmacion de pedido</Text>
                </ListItem>

                <ListItem>
                  <Input
                    placeholder="Firma de cliente"
                    onChangeText={(val) => setFirmaCliente(val)}
                    style={{ borderColor: "black", borderWidth: 1 }}
                  />
                </ListItem>

                <ListItem>
                  <Left>
                    <Button danger onPress={handleNotConfirm}>
                      <Text> REGRESAR </Text>
                    </Button>
                  </Left>
                  <Body style={{ marginLeft: 90 }}>
                    <Button onPress={handleConfirm} primary>
                      <Text>Confirmar</Text>
                    </Button>
                  </Body>
                </ListItem>
              </List>
            </Content>
          </>
        )}
      </ScrollView>
    </Container>
  );
};

export default ListRepartidor;
