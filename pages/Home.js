import React, { useState, useEffect } from "react";
import {
  Container,
  Input,
  Label,
  Form,
  Content,
  Item,
  Button,
  Text,
  Header,
  Left,
  Body,
  Right,
} from "native-base";
import { http } from '../libs/http.js';
import AsyncStorage from "@react-native-community/async-storage";

const Home = (props) => {
  const [form, setForm] = useState({ identifier: "", password: "" });

  const handlePress = async () => {
    if (form.identifier !== "" && form.password !== "") {
      try {
        let data = await http.login('auth/local', form);
        let res = await data

        console.log(form);

        if (res) {

          console.log(res);
          await AsyncStorage.setItem("nombre", res.user.username);
          await AsyncStorage.setItem("token", res.jwt);
          await AsyncStorage.setItem("telefono", res.user.telefono.toString());
          props.history.push("/listRepartidor");
        }
      } catch (error) {
        console.log('error');
      }
    }
  };

  return (
    <Container>
      <Header style={{ backgroundColor: "white" }}>
        <Left />
        <Body>
          <Text>COSBIOME</Text>
        </Body>
        <Right />
      </Header>
      <Content style={{ marginTop: "45%" }}>
        <Form>
          <Item stackedLabel last>
            <Label>Nombre de usuario</Label>
            <Input
              value={form.identifier}
              onChangeText={(val) => setForm({ ...form, identifier: val })}
            />
          </Item>
          <Item stackedLabel last>
            <Label>Contraseña usuario</Label>
            <Input
              value={form.password}
              onChangeText={(val) => setForm({ ...form, password: val })}
              secureTextEntry
            />
          </Item>
        </Form>
        <Button onPress={handlePress} style={{ marginTop: 50 }} block primary>
          <Text>Iniciar</Text>
        </Button>
      </Content>
    </Container>
  );
};

export default Home;
