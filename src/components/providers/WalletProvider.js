import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
//import { useTranslation } from 'react-i18next'
import setAuthToken from "../../utils/setAuthToken"
import {SERVER_URL, networks} from "../../constants/env";
//import openNotification from "../helpers/notification";
//import {UserContext} from "./UserProvider";
import {getTokenBaseInfo, getTokenBalance, getTokenPriceInUsd} from "../../utils/tokenUtils";
import HighWallet from "../../utils/HighWallet";
//import { get } from 'request';

const WalletContextTemplate = {
  connection : Boolean,
  setConnection : (val) => {},
  myWallet : Object,
  loading : Boolean,
  setLoading : (val) => {},
  tokenList : Array,
  totalPrice : Number,
  network : Object,
  setNetwork : (val) => {},
  tokensInfo : Array,
  getTokenList : (requestData) => {},
  getTransaction : (requestData) => {},
}
const WalletContext = React.createContext(WalletContextTemplate);
const WalletProviderDOM = WalletContext.Provider;



function WalletProvider(props) {
  //const userData = useContext(UserContext);
  //const {t,i18n} = useTranslation();
  const [connection, setConnection] = useState(true);
  const [myWallet, setWallet] = useState({});
  const [loading, setLoading] = useState(false);
  const [tokenList, setTokenList] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [network, setNetwork] = useState(networks[2]);
  const [tokensInfo, setTokensInfo] = useState([]);
  const [, setTransactions] = useState([]);

  useEffect(()=>{
    console.log("tokenlist",tokenList);
  },[tokenList])
  const getTokenList = useCallback(()=>{
      setConnection(true);
      setLoading(true);
      setAuthToken(localStorage.jwtToken)
      axios.post(SERVER_URL + "wallets/getassets",{
        network:network.url,
        publicKey: myWallet.publicKey
      })
        .then((response)=>{
           if (response.data.response) {
            setTokenList(response.data.data);
           }
        })
        .catch(err=>{
          setConnection(false);
        })  
  },[myWallet.publicKey, network, setTokenList, setConnection, setLoading])

  const getTokenInfo = useCallback(async()=>{
      setConnection(true);
      try {
        
        let oldTokensInfo=[];
        let oldtotalPrice=0;
        for(var i=0;i<tokenList.length;i++){
          let init={name:"",price:-1,balance:-1,address:""};
          let {decimal,symbol}=await getTokenBaseInfo(tokenList[i],network.url);
          init.name=symbol;
          init.address=tokenList[i];
          init.price = await getTokenPriceInUsd(network, tokenList[i])
          init.balance= await getTokenBalance(tokenList[i], decimal, network.url, myWallet.publicKey);
          ////console.log("deciaml",init.balance);
          oldTokensInfo.push(init);
          oldtotalPrice+=init.balance*init.price;
        }
        setTokensInfo(oldTokensInfo);
        setTotalPrice(oldtotalPrice);
      } catch (error) {
        setConnection(false);
      }

      setLoading(false);
  }, [tokenList, network, setTokensInfo, setTotalPrice, setConnection, setLoading, myWallet.publicKey]);

  const getTransaction = useCallback(()=>{ 
      setConnection(true);
      setAuthToken(localStorage.jwtToken)
      axios.post(SERVER_URL + "wallets/gettransaction", {
        network:network.url,
        publicKey: myWallet.publicKey
      })
          .then((response)=>{
             if (response.data.response) {
              let oldtransaction=[];
              response.data.data.map(item=>oldtransaction.push(item.hash));
              setTransactions(oldtransaction);
             }
          }).catch(err=>{
            
            setConnection(false);
          })
    }, [myWallet.publicKey, network, setTransactions, setConnection])

    let publicKey = localStorage.getItem("publicKey");
    let privateKey = localStorage.getItem("privateKey");

    useEffect(()=>{
      let publicKey = localStorage.getItem("publicKey");
      let privateKey = localStorage.getItem("privateKey");
      if(publicKey && privateKey)
      {
        let newWallet = new HighWallet("bsc-mainnet",privateKey,publicKey);
        setWallet(newWallet);
      }
    },[publicKey,privateKey])

    useEffect(()=>{
      if(myWallet)
        myWallet.setNetwork(network.url);
        getTokenList();
        getTransaction();
    },[network, myWallet, connection, setConnection, setWallet, setTokenList, setTotalPrice, setTokensInfo, setLoading, setTransactions, setNetwork, getTransaction, getTokenList, getTokenInfo])

    useEffect(()=>{
      if(tokenList.length>0)
        getTokenInfo();
    },[tokenList, network, getTokenInfo, setTokensInfo, setTotalPrice, setConnection, setLoading, setTotalPrice, setTokensInfo, setLoading, setConnection, setNetwork, getTransaction, getTokenList, getTransaction])
  return(
          <WalletProviderDOM value={
            {
              connection,
              setConnection,
              myWallet,
              loading,
              setLoading,
              tokenList,
              totalPrice,
              network,
              setNetwork,
              tokensInfo,
              getTokenList,
              getTransaction
            }
          }>
            {props.children}
          </WalletProviderDOM>

    )
}

export {WalletContext};
export default WalletProvider;
