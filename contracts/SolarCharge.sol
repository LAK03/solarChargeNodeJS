

pragma solidity ^0.4.19;

contract SolarCharge {
	struct User {
		string name;
		string mobileno;
	    address userAccount;
        uint amountPaid;
        uint solcoins;
    }

    mapping (bytes32 => User) public users;

    struct Station {
        uint rate;
        string location;
        uint coinBalance;
        uint lastActivated;
        uint lastDuration;
    }

    mapping (uint => Station) public stations;

	address public owner;
	uint public numUsers;
	uint public numStations;
	uint public coinRate;



	function SolarCharge() public {
		owner = msg.sender;
		numUsers = 0;
		coinRate = 100000;
		numStations = 0;
	}

	function registerUser(string _email, string _name,string _mobileno) payable public {
		bytes32 email = stringToBytes(_email);

		if(users[email].userAccount>0){
			revert();
		}

		User storage u = users[email];
        u.userAccount = msg.sender;
        u.name = _name;
				u.mobileno = _mobileno;
        u.amountPaid = 0;
        u.solcoins =0;
		numUsers += 1;
	}

	function buyCoins(string _email, uint _amount) payable public {
		bytes32 email = stringToBytes(_email);

		/*if(users[email].userAccount!=msg.sender){
			revert();
		}*/
        users[email].amountPaid += _amount;
        users[email].solcoins += _amount/coinRate;

	}

	function addStation(uint ID, uint _rate, string _location) public {
		if(msg.sender!=owner){
			revert();
		}
		if(stations[ID].rate!=0){
			revert();
		}

		Station storage s = stations[ID];
        s.coinBalance = 0;
        s.lastActivated = 0;
        s.lastDuration = 0;
        s.location = _location;
        s.rate = _rate;
        numStations += 1;
	}

	function activateStation(string _email, uint ID, uint duration) public {
		bytes32 email = stringToBytes(_email);

		// Station does not exist
		if(stations[ID].rate==0){
			revert();
		}

		// Station is busy
		if(now<(stations[ID].lastActivated+stations[ID].lastDuration)){
			revert();
		}

		uint coinsRequired = stations[ID].rate*duration;

		// User has insufficient coins
		if (users[email].solcoins<coinsRequired){
			revert();
		}

        users[email].solcoins -= coinsRequired;
        stations[ID].coinBalance += coinsRequired;
        stations[ID].lastActivated = now;
        stations[ID].lastDuration = duration;
	}

	function getStationState(uint256 ID) public constant returns (uint calcValue){
		calcValue = (stations[ID].lastActivated+stations[ID].lastDuration);
	}

	function getUser(string _email) public constant returns (string name, string number,address userAccount, uint amountPaid, uint solcoins) {
		bytes32 email = stringToBytes(_email);
		name = users[email].name;
		number = users[email].mobileno;
		userAccount = users[email].userAccount;
        amountPaid = users[email].amountPaid;
        solcoins = users[email].solcoins;
	}

	function getStation(uint ID) public constant returns (uint rate,
            string location, uint coinBalance,
            uint lastActivated, uint lastDuration){
		rate = stations[ID].rate;
        location = stations[ID].location;
        coinBalance = stations[ID].coinBalance;
        lastActivated = stations[ID].lastActivated;
        lastDuration = stations[ID].lastDuration;
	}

	function getStationInfo(uint ID) public constant returns (uint rate,
						string location, uint coinBalance,
						uint lastActivated, uint lastDuration,uint timenow){
		rate = stations[ID].rate;
				location = stations[ID].location;
				coinBalance = stations[ID].coinBalance;
				lastActivated = stations[ID].lastActivated;
				lastDuration = stations[ID].lastDuration;

				timenow = now;
	}



	// Converts 'string' to 'bytes32'
	function stringToBytes(string s) public pure returns (bytes32) {
	  bytes memory b = bytes(s);
	  uint r = 0;
	  for (uint i = 0; i < 32; i++) {
	      if (i < b.length) {
	          r = r | uint(b[i]);
	      }
	      if (i < 31) r = r * 256;
	  }
	  return bytes32(r);
	}

	function destroy() public{
		if (msg.sender == owner) {
			selfdestruct(owner);
		}
	}
}
