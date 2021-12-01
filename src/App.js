import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

export default function App() {
	const [currentAccount, setCurrentAccount] = useState("");
	const [message, setMessage] = useState("");
	const [allWaves, setAllWaves] = useState([]);

	const contractAddress = "0x50a4c37cEcBe10F4903f2B3b414b5Ec8127362A3";

	const contractABI = abi.abi;

	const checkIfWalletIsConnected = async () => {
		try {
			const { ethereum } = window;
			if (!ethereum) {
				console.log("Make sure you have metamask!!");
			} else {
				console.log("We have the ethereum object", ethereum);
			}

			const accounts = await ethereum.request({ method: "eth_accounts" });

			if (accounts.length !== 0) {
				const account = accounts[0];
				console.log("Found an authorized account: ", account);
				setCurrentAccount(account);
				getAllWaves();
			} else {
				console.log("Not Authorized account found!");
			}
		} catch (error) {
			console.log(error);
		}
	};

	const connectWallet = async () => {
		try {
			const { ethereum } = window;
			if (!ethereum) {
				alert("Please get metamask");
			}

			const accounts = ethereum.request({
				method: "eth_requestAccounts",
			});
			console.log("Connected: ", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);
		}
	};

	const wave = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);
				let count = await wavePortalContract.getTotalWaves();
				console.log("Retrived total wave count: ", count.toNumber());

				const waveTxn = await wavePortalContract.wave(message, {
					gasLimit: 300000,
				});
				setMessage("");

				console.log("Mining...", waveTxn.hash);

				await waveTxn.wait();
				console.log("Mined...", waveTxn.hash);

				count = await wavePortalContract.getTotalWaves();
				console.log("Retrived total wave count...", count.toNumber());

				getAllWaves();
			}
		} catch (error) {
			console.log(error);
		}
	};

	const getAllWaves = async () => {
		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);

				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);

				const waves = await wavePortalContract.getAllWaves();

				let wavesCleaned = [];

				waves.forEach((wave) => {
					wavesCleaned.push({
						address: wave.waver,
						timestamp: new Date(wave.timestamp * 1000),
						message: wave.message,
					});
				});
				setAllWaves(wavesCleaned);
			}
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		checkIfWalletIsConnected();
	}, []);

	useEffect(() => {
		let contract;

		const onNewWave = (_from, _timestamp, _messgae) => {
			console.log("newWave: ", _from, _timestamp, _messgae);
			setAllWaves((prevState) => [
				...prevState,
				{
					address: _from,
					timestamp: new Date(_timestamp * 1000),
					message: message,
				},
			]);
		};

		if (window.ethereum) {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();

			contract = new ethers.Contract(
				contractAddress,
				contractABI,
				signer
			);
			contract.on("NewWave", onNewWave);
		}

		return () => {
			if (contract) {
				contract.off("NewWave");
			}
		};
	}, []);

	return (
		<div className="mainContainer">
			<div className="dataContainer">
				<div className="header">
					{" "}
					<span role="img" aria-label="hello">
						👋
					</span>{" "}
					Hey there!
				</div>

				<div className="bio">
					I am Nenba Jonathan and I'm a Software Engineer so that's
					pretty cool right? Connect your Ethereum wallet and wave at
					me!
				</div>
				<textarea
					className="message"
					name="message"
					rows={10}
					value={message}
					onChange={(event) => setMessage(event.target.value)}
				/>
				<button className="waveButton" onClick={wave}>
					Wave
				</button>

				{!currentAccount && (
					<button className="waveButton" onClick={connectWallet}>
						Connect wallet
					</button>
				)}

				{allWaves.map((w, index) => {
					return (
						<div key={index} className="card">
							<div>Address: {w.address}</div>
							<div>Time: {w.timestamp.toString()}</div>
							<div>Message: {w.message}</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
