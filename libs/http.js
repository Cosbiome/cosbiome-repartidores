import axios from 'axios';

// const endpointserver = 'https://cosbiome-backend.herokuapp.com/';
const endpointserver = 'http://192.168.100.23:1337/';
import AsyncStorage from "@react-native-community/async-storage";

class Http 
{
    static instance = new Http();

    get = async(url) => 
    {
        try 
        {
            console.log(`${endpointserver}${url}`);

            let req = await axios.get(`${endpointserver}${url}`, {
                headers: {
                    "Authorization": `Bearer ${await AsyncStorage.getItem('token')}`
                }
            });

            return req.data;
        } 
        catch (error) 
        {
            console.log('http get method err',  error);

            throw Error(error);
        }
    }

    post = async (url, body) => 
    {
        try 
        {
            let req = await axios.post(`${endpointserver}${url}`, body, {
                headers:
                {
                    "Content-type": "application/json",
                    "Authorization": `Bearer ${await AsyncStorage.getItem('token')}`
                }
            });
    
            return req.data;    
        } 
        catch (error) 
        {
            console.log('http post method err',  error);

            throw Error(error);
        }
    }

    update = async (url, body) => 
    {
        try 
        {
            let req = await axios.put(`${endpointserver}${url}`, body, {
                headers:
                {
                    "Content-type": "application/json",
                    "Authorization": `Bearer ${await AsyncStorage.getItem('token')}`
                }
            });
    
            return req.data;    
        } 
        catch (error) 
        {
            console.log('http put method err',  error);

            throw Error(error);
        }
    }

    delete = async (url) => 
    {
        try 
        {
            let req = await axios.delete(`${endpointserver}${url}`, {
                headers: {
                    "Authorization": `Bearer ${await AsyncStorage.getItem('token')}`
                }
            });

            return req.data;
        } 
        catch (error) 
        {
            console.log('http delete method err',  error);

            throw Error(error);
        }
    }

    login = async (url, body) => 
    {
        try 
        {
            let req = await axios.post(`${endpointserver}${url}`, body, {
                headers:
                {
                    "Content-type": "application/json",
                }
            });
    
            return req.data;    
        } 
        catch (error) 
        {
            console.log('http post method err',  error);

            throw Error(error);
        }
    }

}

const http = new Http();

export {http};