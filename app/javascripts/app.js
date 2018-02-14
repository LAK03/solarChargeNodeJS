import "../stylesheets/app.css";

// Import libraries we need.
import {
  default as Web3
} from 'web3';
import {
  default as contract
} from 'truffle-contract'

import {
  Connect,
  SimpleSigner
} from 'uport-connect'
import kjua from 'kjua'
import mnid from 'mnid'



var postURL = 'http://192.168.0.106:5000';
// uPort object creation
// Keys are from the app manager
const uport = new Connect('Smart Lock', {
  clientId: '2ouhJFVGgCxqugbEp87H7sxTz1o6XadGipa',
  signer: SimpleSigner('37dae5ffa08beddd76b16fbfba5342207e77edcefa52b601ea4911bf1d486aa1')
})


import solar_artifacts from '../../build/contracts/SolarCharge.json'

var SolarCharger = contract(solar_artifacts);

var accounts;
var account;
var balance;
var ticketPrice;
var myContractInstance;
var login_email;

var ip = location.hostname;

function setStatus(message) {
  $("#status").html(message);
};

function refreshBalance() {
  $("#cb_balance").html(web3.fromWei(
    web3.eth.getBalance(web3.eth.coinbase), "ether").toFixed(5));
}

function refreshVars() {
  SolarCharger.deployed().then(function(contractInstance) {
    contractInstance.numUsers.call().then(function(numUsers) {
      $("#cf_users").html(numUsers.toNumber());
      contractInstance.numStations.call().then(function(numStations) {
        $("#cf_stations").html(numStations.toNumber());
      });
    });
    //  refreshBalance();
  });

}

function getStationDetails() {
  SolarCharger.deployed().then(function(contractInstance) {
    contractInstance.getStation.call('123').then(
      function(result) {
        console.log("result: " + result);
        sessionStorage.setItem('stationID', '123');
        sessionStorage.setItem('rate', result[0]);
        sessionStorage.setItem('location', result[1]);
      });
  });
}


window.uportbtn = function() {
  console.log("Inside uport register function");
  uport.requestCredentials({
      requested: ['name', 'email', 'phone', 'country'],
      notifcations: true
    },
    (uri) => {

      const qr = kjua({
        text: uri,
        fill: '#0619ac',
        size: 300,
        back: 'rgba(255,255,255,1)'
      })

      $('#kqr').html(qr);

    }).then((userProfile) => {
    console.log(userProfile);
    $('#kqr').html('');
    var email = userProfile.email;
    var name = userProfile.name;
    var phone = userProfile.phone;
    console.log("Email ID " + email);
    console.log("Name :" + name);
    console.log("phone: " + phone);
    registerContract(email, name, phone);
  })

}


window.uportLoginbtn = function() {
  var email;
  var name;
  var phone;
  var add;
  console.log("Inside uport Login function");

  uport.requestCredentials({
      requested: ['name', 'email', 'phone', 'country', 'address'],
      notifcations: true
    },
    (uri) => {

      const qr = kjua({
        text: uri,
        fill: '#0619ac',
        size: 300,
        back: 'rgba(255,255,255,1)'
      })
      $('#kqr').html(qr);


    }).then((userProfile) => {
    $('#kqr').html('');
    console.log(userProfile);
    email = userProfile.email;
    name = userProfile.name;
    phone = userProfile.phone;
    var add = userProfile.address;
    console.log("Email ID " + email);
    console.log("Name :" + name);
    console.log("Phone:" + phone);
    console.log("address:" + add);


    LoginUportUser(name, email, phone, add);
  })


}

function LoginUportUser(name, email, phone, add) {
  //var uport_add = mnid.isMNID(add);
  //console.log("uport address:"+uport_add);
  SolarCharger.deployed().then(function(contractInstance) {
    contractInstance.getUser.call(email).then(
      function(result) {

        console.log("name: " + result[0]);
        console.log("phone: " + result[1]);
        console.log("address: " + result[2]);
        console.log("amount: " + result[3]);
        console.log("balance: " + result[4]);
        if (name.toUpperCase() == result[0].toUpperCase() && phone == result[1]) {
          console.log("Login successfull");

          //  $("#cf_address").html(contractInstance.address);
          //$("#cb_balance").html(web3.fromWei(web3.eth.getBalance(contractInstance.address), "ether").toFixed(5));
          contractInstance.coinRate.call().then(function(coinRate) {
            console.log("coinRate " + coinRate);
            sessionStorage.setItem('cf_rate', coinRate);
          });
          getStationDetails();
          sessionStorage.setItem('username', result[0]);
          sessionStorage.setItem('useremail', email);
          sessionStorage.setItem('address', result[2]);
          sessionStorage.setItem('amountpaid', result[3]);
          sessionStorage.setItem('balance', result[4]);
          sessionStorage.setItem('cb_address', add);

          //  sessionStorage.setItem('cb_balance',web3.fromWei(web3.eth.getBalance(web3.eth.coinbase), "ether").toFixed(5));

          window.location.href = 'app/home.html';
        } else {
          console.log("Login failed");
        }
      });
  });

}
window.registeruser = function(solar) {
  var name = $("#name").val();
  var email = $("#email").val();
  var phone = 9876
  setStatus("Initiating transaction... (please wait)");
  registerContract(name, email, phone);
}

function registerContract(email, name, phone) {
  console.log("inside register contract");
  SolarCharger.deployed().then(function(contractInstance) {
    contractInstance.registerUser(email, name, phone, {
      from: web3.eth.coinbase,
      gas: 2000000
    }).then(
      function(result) {
        setStatus("Done!");
        refreshVars();
      });
  });
}

window.buyCoins = function(solar) {
  var amount = parseFloat($("#amount").val() * 1.0e18);
  var email = sessionStorage.getItem('useremail');
  console.log("email:" + email);
  console.log("Initiating transaction... (please wait)");
  var web3_uport = uport.getWeb3();
  /* web3_uport.eth.getCoinbase((error, address) => {
    if (error) { throw error }
    var add = address;
	console.log("uport address:"+add);
  });*/

  console.log("amount:" + amount);
  web3_uport.eth.sendTransaction({
      to: web3.eth.coinbase,
      value: amount
    },
    (error, txHash) => {
      if (error) {
        throw error
      }
      var txHashSentEth = txHash

    }
  );

  // SolarCharger.deployed().then(function(contractInstance) {
  //   contractInstance.buyCoins(email, amount).then(
  //     function(result) {
  //       contractInstance.getUser.call(email).then(
  //         function(result) {
  //           //setStatus("Done!");
  //           //refreshVars();
  //           console.log("name: " + result[0]);
  //           console.log("phone: " + result[1]);
  //           console.log("address: " + result[2]);
  //           console.log("amount: " + result[3]);
  //           console.log("balance: " + result[4]);
  //           sessionStorage.setItem('amountpaid', result[3]);
  //           sessionStorage.setItem('balance', result[4]);
  //           $('#amountpaid').html(result[3].toNumber());
  //           $('#balance').html(result[4].toNumber());
  //
  //
  //         });
  //       console.log("Done!");
  //
  //       //  refreshVars();
  //     });
  // });
}

window.SelectedStation = function() {
  console.log("Station ID 123 selected");
  var name = sessionStorage.getItem('username');
  var email = sessionStorage.getItem('useremail');
  var amount = sessionStorage.getItem('balance');
  console.log("name:" + name + ":email:" + email + "amount:" + amount);
  sessionStorage.setItem('username', name);
  sessionStorage.setItem('useremail', email);
  sessionStorage.setItem('balance', amount);
  $('#useremail').html(name);
  $('#username').html(email);
  $('#balance').html(amount);
  getStationDetails();
  window.location.href = '../app/contract.html';
}

window.btnpay = function() {
  //  window.location.href = './transact.html';
  console.log("inside pay button func");
  var rate = sessionStorage.getItem('rate');
  var minutes = $("#minutes").val();
  console.log("rate:" + rate);
  console.log("minutes:" + minutes);
  var amount = minutes * rate * 60;
  console.log("amount:" + amount);
  $('#amount').html(amount);
  $('#cnfminutes').html(minutes);
  //sessionStorage.setItem('amount', amount);
  //sessionStorage.setItem('minutes', minutes);

}

function login() {
  var name = $("#name").val();
  var email = $("#email").val();
  SolarCharger.deployed().then(function(contractInstance) {
    contractInstance.getUser.call(email).then(
      function(result) {

        console.log("name: " + result[0]);
        console.log("phone: " + result[1]);
        console.log("address: " + result[2]);
        console.log("amount: " + result[3]);
        console.log("balance: " + result[4]);
        if (ignoreCase.equals(name, result[0])) {
          console.log("Login successfull");

          //  $("#cf_address").html(contractInstance.address);
          //$("#cb_balance").html(web3.fromWei(web3.eth.getBalance(contractInstance.address), "ether").toFixed(5));
          contractInstance.coinRate.call().then(function(coinRate) {
            console.log("coinRate " + coinRate);
            sessionStorage.setItem('cf_rate', coinRate);
          });
          getStationDetails();
          sessionStorage.setItem('username', result[0]);
          sessionStorage.setItem('useremail', email);
          sessionStorage.setItem('address', result[2]);
          sessionStorage.setItem('amountpaid', result[3]);
          sessionStorage.setItem('balance', result[4]);
          sessionStorage.setItem('cb_address', web3.eth.coinbase);
          // sessionStorage.setItem('cb_balance',web3.fromWei(web3.eth.getBalance(web3.eth.coinbase), "ether").toFixed(5));

          window.location.href = 'app/home.html';
        } else {
          console.log("Login failed");
        }
      });
  });
  window.location.href = 'app/home.html';
}

window.btnconfirm = function() {
  console.log("Inside confirmation page");

  var login_email = 'emailtoanusha03@gmail.com';
  var station_ID = $("#stationID").val();
  var SID = '123';
  var email = sessionStorage.getItem('useremail');
  var station_ID = sessionStorage.getItem('stationID');

  var duration = $("#minutes").val();
  var time = duration * 60;
  console.log("email:" + email + "station_ID:" + station_ID + "duration:" + duration);
  SolarCharger.deployed().then(function(contractInstance) {
    contractInstance.activateStation(email, station_ID, time, {
      from: web3.eth.coinbase,
      gas: 3000000
    }).then(
      function(result) {
        console.log("charging activated ");
        var rate = sessionStorage.getItem('rate');
        var time = sessionStorage.getItem('cnfminutes');
        var balance = sessionStorage.getItem('balance');
        var amount = balance - (rate * time * 60);
        console.log("balance amount:" + amount);
        sessionStorage.setItem('balance', amount);
        $('#balance').html(amount);
        $('#cnfPage').show();

      });
  });
  //window.location.href = './confirm.html';
}

$(document).ready(function() {
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source like AWS")
    // Use Mist/MetaMask's provider
    // window.web3 = new Web3(web3.currentProvider);
    //  window.web3 = new Web3(new Web3.providers.HttpProvider("http://"+ip+":8545"));
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://" + ip + ":8545"));
    console.log("Connectiong to ip - if->" + window.web3);
    //window.web3 = new Web3(new Web3.providers.HttpProvider("http://ec2-34-210-156-191.us-west-2.compute.amazonaws.com:8000"));
  } else {
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://" + ip + ":8545"));
    console.log("Connected to " + ip + "- else->" + window.web3);
  }
  console.log("HI " + web3.eth.coinbase);
  //SolarCharger.setProvider(web3.currentProvider);
  SolarCharger.setProvider(window.web3.currentProvider);

  web3.eth.getAccounts(function(err, accs) {
    if (err != null) {
      alert('There was an error fetching your accounts.');
      return;
    }
    if (accs.length == 0) {
      alert("Coundn't get any accounts!");
      return;
    }

    console.log('No of accounts->' + accs.length);
    accounts = accs;
    account = accounts[1];
    console.log('No of accounts->' + accounts[0]);
    //console.log('No of accounts->'+accounts[1]);
    //initializeContract();

    SolarCharger.deployed().then(function(contractInstance) {
      $("#cf_address").html(contractInstance.address);
      //  $("#cb_address").html(account);
      refreshVars();
      contractInstance.addStation('123', '2', 'bay area SFO', {
        from: web3.eth.coinbase,
        gas: 2000000
      }).then(
        function(result) {
          console.log("station Registration Done!");
        });
    });
  });
  $("#loginwithgoogle").on('click', function(e) {
    e.preventDefault();
    login();
  });

});
