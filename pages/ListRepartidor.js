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

const ListRepartidor = (props) => {
  const [prueba, setPrueba] = useState({ data: { repartidores: [] } });
  const [view, setView] = useState(true);
  const [details, setDetails] = useState({
    numTel1: "",
    estatusPedido: "",
  });
  const [indexRep, setIndexRep] = useState(0);
  const [firmaCliente, setFirmaCliente] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [telefonovue, setTelefonoVue] = useState("false");

  useEffect(() => {
    handleFetchGet();
  }, []);

  useEffect(() => {
    console.log("details =>", details);
  }, [details]);

  const handleFetchGet = async () => {
    let fecha;
    if (new Date().getDate() < 10) {
      fecha = `${new Date().getFullYear()}-0${
        new Date().getMonth() + 1
      }-0${new Date().getDate()}`;
    } else {
      fecha = `${new Date().getFullYear()}-0${
        new Date().getMonth() + 1
      }-${new Date().getDate()}`;
    }
    let nombre = await AsyncStorage.getItem("nombre");

    let rutaB = await http.get(
      `pedidos-rutas/?fechaEntrega=${fecha}&repartidor=${nombre}`
    );

    console.log("details =>", fecha);

    parseFirebaseNorm(rutaB, setPrueba);
  };

  const handleClick = async (idPedido) => {
    setView(false);
    let detailData = prueba.data.filter((ped) => ped.id === idPedido)[0];
    let arrayTotalProds = prueba.data
      .filter((ped) => ped.id === idPedido)[0]
      .producto.map((a) => parseInt(a.cantidad));
    let sumaTotalProds = arrayTotalProds.reduce((a, b) => a + b);
    detailData.totalProductosPedido = sumaTotalProds;
    parseFirebaseNorm(detailData, setDetails);
  };

  const handleConfirm = async () => {
    if (firmaCliente.length > 0) {
      await http.update("pedidos-rutas/" + details.id, {
        firmaCliente: firmaCliente,
        esperaRuta: false,
        estatusPedido: "entregado",
      });

      if (details.data.idCliente) {
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
      }

      setView(true);
      setDetails({});
      setFirmaCliente("");

      handleFetchGet();
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

    await http.update("pedidos-rutas/" + details.id, {
      esperaRuta: false,
      estatusPedido: "REPROGRAMADO",
    });

    details.data.idPedido = details.data.idPedido + "R";
    details.data.numTel1 = details.data.numTel;
    details.data.estatusPedido = "REPROGRAMADO";

    await http.post("preventa-calidads", details.data);

    setView(true);
    setDetails({});
    setFirmaCliente("");

    handleFetchGet();
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
            {prueba.data.length > 0 ? (
              prueba.data.map((a, index) => {
                console.log(a.de.split(":"));
                let hora = new Date().getHours();
                let minutos = new Date().getMinutes();
                let horaFormatNew = a.de.split(":");
                let horaFloat = parseFloat(
                  `${horaFormatNew[0]}.${horaFormatNew[1]}`
                );
                let horaFloat2 = parseFloat(`${hora}.${minutos}`);
                let yellow15 = horaFloat - horaFloat2;

                console.log(yellow15);
                console.log(yellow15 > 0.45 && yellow15 < 0.55);

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

                return a.esperaRuta ? (
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
                      <Text style={{ fontSize: 11 }}>{a.idPedido}</Text>
                    </Left>
                    <Body>
                      <Text style={{ fontSize: 11 }}>{a.nombreCliente}</Text>
                    </Body>
                    <Right>
                      <Icon name="arrow-forward" />
                    </Right>
                  </ListItem>
                ) : a.estatusPedido === "entregado" ? (
                  <ListItem
                    key={a.id}
                    disabled={true}
                    style={{ backgroundColor: "green" }}
                    itemHeader
                  >
                    <Left>
                      <Text style={{ fontSize: 11, color: "white" }}>
                        {a.idPedido}
                      </Text>
                    </Left>
                    <Body>
                      <Text style={{ fontSize: 11, color: "white" }}>
                        {a.nombreCliente}
                      </Text>
                    </Body>
                    <Right>
                      <Text style={{ fontSize: 11, color: "white" }}>
                        {a.estatusPedido} - $ {a.total}
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
                        {a.idPedido}
                      </Text>
                    </Left>
                    <Body>
                      <Text style={{ fontSize: 11, color: "white" }}>
                        {a.nombreCliente}
                      </Text>
                    </Body>
                    <Right>
                      <Text style={{ fontSize: 11, color: "white" }}>
                        {a.estatusPedido} - $ {a.total}
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
