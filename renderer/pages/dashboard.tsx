import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import io from 'socket.io-client'

export default function HomePage() {
  // State to store vital signs data
  const [vitalSigns, setVitalSigns] = useState({
    heartRate: '',
    oxygenSaturation: '',
    bloodPressure: ''
  });
  
  // State to track connection status
  const [connected, setConnected] = useState(false);
  // State to store current time
  const [currentTime, setCurrentTime] = useState('');
  const [currentTime2, setCurrentTime2] = useState('');
  // State for calibration modal
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  // State for calibration progress
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  // State for calibration status message
  const [calibrationStatus, setCalibrationStatus] = useState('');
  // State for error modal
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Socket reference
  const [socketRef, setSocketRef] = useState(null);
  const [lightStatus, setLightStatus] = useState(false);
  const [fan1Status, setFan1Status] = useState(false);
  const [fan2Status, setFan2Status] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [airMode, setAirMode] = useState(false);
  const [ventilMode, setVentilMode] = useState(0); // 0: Off, 1: Low, 2: High
  const [light2Status, setLight2Status] = useState(false);
  
  useEffect(() => {
    console.log("useEffect");
    // Initialize socket connection
    const socket = io('http://172.20.10.3:4000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Add error handling
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnected(false);
    });

    socket.on('connect_timeout', (timeout) => {
      console.error('Socket connection timeout:', timeout);
      setConnected(false);
    });
    
    
    // Store socket reference
    setSocketRef(socket);
    
    // Handle connection event
    socket.on('connect', () => {
      console.log('Connected to socket server');
      setConnected(true);

    // setTimeout(() => {
    //   socket.emit('serialSend', 'R');
    // }, 1000);
      
      // Set current time on connection
      updateCurrentTime();
    });

    let lastStatus;
   
    
    // Handle disconnection event
    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setConnected(false);
    });
    
    // Listen for vital signs updates
    socket.on('vitalSigns', (data) => {
      // console.log('Received vital signs data:', data);
      setVitalSigns(data);
      updateCurrentTime();
    });
    
    // Listen for calibration progress updates
    socket.on('calibrationProgress', (data) => {
      //console.log('Calibration progress:', data);
      setCalibrationProgress(data.progress);
      setCalibrationStatus(data.status);
      
      // Close modal when calibration is complete
      if (data.progress === 100) {
        setTimeout(() => {
          setShowCalibrationModal(false);
        }, 2000);
      }
    });
    
    // Function to update current time
    const updateCurrentTime = () => {
      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;
      setCurrentTime(formattedDate);
      const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setCurrentTime2(formattedTime);
    };
    
    // Clean up socket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  // Function to start calibration
  const startCalibration = () => {
    setShowCalibrationModal(true);
    setCalibrationProgress(0);
    setCalibrationStatus('Starting calibration...');
    
    if (socketRef) {
      socketRef.emit('serialSend', 'C');
    }
  };

  const setLight = () => {
    console.log("setLight");
    console.log(socketRef);
    if (socketRef) {
      const newValue = lightStatus ? 0 : 255;
      socketRef.emit('writeRegister', { register: "R01700", value: newValue });
      setLightStatus(!lightStatus);
    }
  }

  const setFan1 = () => {
    if (socketRef) {
      const newValue = fan1Status ? 0 : 255;
      socketRef.emit('writeRegister', { register: "R01704", value: newValue });
      setFan1Status(!fan1Status);
    }
  };

  const setFan2 = () => {
    if (socketRef) {
      const newValue = fan2Status ? 0 : 255;
      socketRef.emit('writeRegister', { register: "R01706", value: newValue });
      setFan2Status(!fan2Status);
    }
  };

  const setVentil = () => {
    console.log("setVentil");
    if (socketRef) {
      const newMode = (ventilMode + 1) % 3;
      const newValue = newMode === 0 ? 0 : (newMode === 1 ? 1 : 2);
      console.log("newValue", newValue);
      if(newValue === 0){
        socketRef.emit('writeBit', { register: "M0202", value: 0 });
                socketRef.emit('writeBit', { register: "M0203", value: 0 });

      } else if (newValue === 1) {
 socketRef.emit('writeBit', { register: "M0202", value: 1 });
                socketRef.emit('writeBit', { register: "M0203", value: 0 });      } else if (newValue === 2) {
 socketRef.emit('writeBit', { register: "M0202", value: 0 });
                socketRef.emit('writeBit', { register: "M0203", value: 1 });      }
      setVentilMode(newMode);
    }
  }

  const setAuto = () => {
    console.log("setAuto");
    if (socketRef) {
      const newValue = autoMode ? 0 : 1;
      socketRef.emit('writeBit', { register: "M0201", value: newValue  });
      setAutoMode(!autoMode);
    }

  }

  const setAir = () => {
    console.log("setAir");
    if (socketRef) {
      const newValue = airMode ? 0 : 1;
      socketRef.emit('writeBit', { register: "M0200", value: newValue });
      setAirMode(!airMode);
    }
  }

  const setLight2 = () => {
    console.log("setLight2");
    if (socketRef) {
      const newValue = light2Status ? 0 : 255;
      socketRef.emit('writeRegister', { register: "R01702", value: newValue });
      setLight2Status(!light2Status);
    }
  }

  // Function to reset all data
  const resetData = () => {
    setVitalSigns({
      heartRate: '',
      oxygenSaturation: '',
      bloodPressure: ''
    });
  };

  return (
    <>
       <link
            href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
      <div className="vital-sign-home-container10">
      
      <div className="vital-sign-home-dashboard">
        <div className="vital-sign-home-basic-header">
          <img
              alt="HipertechLogo2501"
              src="/external/hipertechlogo2501-ygje.svg"
              className="page1-hipertech-logo"
            />
        </div>
        <div className="vital-sign-home-card-container">
          <div className="vital-sign-home-number-card1">
            <div className="vital-sign-home-frame1">
              <span className="vital-sign-home-text10">Kabin Kontrol</span>
            </div>
              <div className="vital-sign-home-group46">
                
              <button 
                className="vital-sign-home-frame-button1" 
                onClick={setAuto}
                style={{ backgroundColor: autoMode ? '#C9372C' : 'rgba(0, 122, 94, 1)' }}
              >
                <div className="vital-sign-home-container11">
                  <span className="vital-sign-home-text11">{autoMode ? 'Manuel' : 'Otomatik'}</span>
                </div>
              </button>
                <button className="vital-sign-home-frame-button2" onClick={setAir}
                style={{ backgroundColor: airMode ? 'rgb(33,116,212)' : 'rgba(0, 122, 94, 1)' }}
              >
                <div className="vital-sign-home-container12">
                  <span className="vital-sign-home-text12">{airMode ? 'Oksijen' : 'Hava'}</span>
                </div>
              </button>
              <button 
                className="vital-sign-home-frame-button3" 
                onClick={setVentil}
                style={{ backgroundColor: ventilMode === 0 ? 'rgba(0, 122, 94, 1)' : ventilMode === 1 ? '#C9372C' : '#FFA500' }}
              >
                <div className="vital-sign-home-container13">
                  <span className="vital-sign-home-text13">
                    {ventilMode === 0 ? 'Ventilasyon' : ventilMode === 1 ? 'Düşük' : 'Yüksek'}
                  </span>
                </div>
              </button>
            </div>
          </div>
          <div className="vital-sign-home-number-card2">
            <div className="vital-sign-home-frame4">
              <span className="vital-sign-home-text14">Yardımcı Çıkış</span>
            </div>
            <span className="vital-sign-home-text15">Ana Kabin</span>
            <button className="vital-sign-home-frame-button4">
              <div className="vital-sign-home-container14">
                <span className="vital-sign-home-text16">Aç</span>
              </div>
            </button>
            <span className="vital-sign-home-text17">Ara Kabin</span>
            <button className="vital-sign-home-frame-button5">
              <div className="vital-sign-home-container15">
                <span className="vital-sign-home-text18">Aç</span>
              </div>
            </button>
          </div>
          <div className="vital-sign-home-frame471">
            <div className="vital-sign-home-number-card3">
              <div className="vital-sign-home-frame31">
                <div className="vital-sign-home-frame5">
                  <span className="vital-sign-home-text19">Fan </span>
                </div>
                <div className="vital-sign-home-frame6">
                  <span className="vital-sign-home-text20">
                    Ana Kabin
                    <span
                      dangerouslySetInnerHTML={{
                        __html: ' ',
                      }}
                    />
                  </span>
                  <span className="vital-sign-home-text21">Ara Kabin</span>
                </div>
              </div>
              <div className="vital-sign-home-frame472">
                <button 
                  className="vital-sign-home-frame-button6"
                  onClick={setFan1}
                  style={{ backgroundColor: fan1Status ? '#C9372C' : 'rgba(0, 122, 94, 1)' }}
                >
                  <div className="vital-sign-home-container16">
                    <span className="vital-sign-home-text22">{fan1Status ? 'Kapat' : 'Aç'}</span>
                  </div>
                </button>
                <button 
                  className="vital-sign-home-frame-button7"
                  onClick={setFan2}
                  style={{ backgroundColor: fan2Status ? '#C9372C' : 'rgba(0, 122, 94, 1)' }}
                >
                  <div className="vital-sign-home-container17">
                    <span className="vital-sign-home-text23">{fan2Status ? 'Kapat' : 'Aç'}</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="vital-sign-home-number-card4">
              <div className="vital-sign-home-frame32">
                <div className="vital-sign-home-frame7">
                  <span className="vital-sign-home-text24">Aydınlatma </span>
                </div>
                <div className="vital-sign-home-frame8">
                  <span className="vital-sign-home-text25">
                    Ana Kabin
                    <span
                      dangerouslySetInnerHTML={{
                        __html: ' ',
                      }}
                    />
                  </span>
                  <span className="vital-sign-home-text26">Ara Kabin</span>
                </div>
              </div>
              <div className="vital-sign-home-frame473">
                <button 
                  className="vital-sign-home-frame-button8" 
                  onClick={setLight}
                  style={{ backgroundColor: lightStatus ? '#C9372C' : 'rgba(0, 122, 94, 1)' }}
                >
                  <div className="vital-sign-home-container18">
                    <span className="vital-sign-home-text27">{lightStatus ? 'Kapat' : 'Aç'}</span>
                  </div>
                </button>
                <button 
                  className="vital-sign-home-frame-button9" 
                  onClick={setLight2}
                  style={{ backgroundColor: light2Status ? '#C9372C' : 'rgba(0, 122, 94, 1)' }}
                >
                  <div className="vital-sign-home-container19">
                    <span className="vital-sign-home-text28">{light2Status ? 'Kapat' : 'Aç'}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
     <div className="page1-frame24">
         
          <span className="page1-text24">{currentTime || '10.03.2025'}</span>
           <span className="page1-text24">{currentTime2 || '14:27'}</span>
         
        </div>
      </div>
    </div>
      <style jsx global>{`
        * {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .page1-text10 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
        }

        .page1-text11 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
        }

        .page1-text12 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
        }

        .page1-text14 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
        }

        .page1-text15 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
        }

        .page1-text16 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
        }

        .page1-text18 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
        }

        .page1-text19 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
        }

        .page1-text24 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
        }

        .calibration-modal h2 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
        }

        .calibration-modal p {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
        }

        .cancel-button {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
        }

        .error-modal h2 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
        }

        .error-modal p {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
        }

        .error-button {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
        }
      `}</style>
      <style jsx>
        {`
          .page1-container {
            width: 100%;
            height: 720px;
            display: flex;
            align-items: center;
            flex-direction: column;
            position: relative;
          }
          .page1-vital-sign-home {
            gap: 19px;
            width: 100%;
            height: auto;
            display: flex;
            padding: 0 48px;
            overflow: hidden;
            align-items: center;
            flex-shrink: 0;
            flex-direction: column;
            background-color: rgba(250, 252, 254, 1);
          }
          .page1-basic-header {
            gap: 236px;
            display: flex;
            padding: 24px 0 0px;
            align-self: stretch;
            align-items: center;
            flex-shrink: 0;
            justify-content: center;
            background-color: rgba(250, 252, 254, 1);
          }
          .page1-hipertech-logo {
            width: 498px;
            height: 91px;
          }
          .page1-logo {
            gap: 4px;
            width: 395px;
            height: 90px;
            display: flex;
            align-items: center;
            flex-shrink: 0;
          }
          .page1-logomark {
            width: 90px;
            height: 90px;
          }
          .page1-text10 {
            color: rgb(33, 116, 212);
            width: 301px;
            font-size: 48px;
            align-self: center;
            font-style: Bold;
            text-align: center;
            font-family: 'Sen';
            font-weight: 700;
            line-height: 100%;
            font-stretch: normal;
            text-decoration: none;
          }
          .page1-card-container1 {
            gap: 23px;
            width: 1147px;
            display: flex;
            z-index: 1;
            align-items: flex-start;
            flex-shrink: 0;
            justify-content: space-between;
          }
          .page1-number-card1 {
            gap: 50px;
            width: 550px;
            height: 250px;
            display: flex;
            padding: 18px 24px;
            overflow: hidden;
            flex-wrap: wrap;
            align-items: flex-start;
            flex-shrink: 0;
            border-color: rgba(0, 0, 0, 0);
            border-style: solid;
            border-width: 1.5px;
            border-radius: 16px;
            justify-content: flex-end;
            background-color: rgba(36, 78, 126, 0.09000000357627869);
          }
          .page1-frame1 {
            gap: 128px;
            width: 494px;
            height: 30px;
            display: flex;
            align-items: center;
            flex-shrink: 0;
            justify-content: space-between;
          }
          .page1-text11 {
            color: rgb(26, 32, 39);
            width: 100%;
            height: auto;
            font-size: 36px;
            font-style: Bold;
            text-align: left;
            font-family: 'Plus Jakarta Sans';
            font-weight: 700;
            line-height: 24px;
            font-stretch: normal;
            text-decoration: none;
          }
          .page1-frame21 {
            gap: 165px;
            width: 494px;
            display: flex;
            padding: 0 16px;
            align-items: center;
            flex-shrink: 0;
            justify-content: space-between;
          }
          .page1-numberdetail1 {
            gap: 10px;
            width: 480px;
            height: 103px;
            display: flex;
            position: relative;
            align-items: flex-end;
            flex-shrink: 0;
            justify-content: flex-end;
          }
          .page1-text12 {
            left: 22px;
            color: rgb(26, 32, 39);
            width: 100%;
            height: auto;
            position: relative;
            font-size: 96px;
            align-self: flex-end;
            font-style: Bold;
            text-align: right;
            font-family: 'Plus Jakarta Sans';
            font-weight: 700;
            line-height: 40px;
            font-stretch: normal;
            text-decoration: none;
            padding-right: 40px;
          }
          .page1-text14 {
            font-size: 40px;
          }
          .page1-number-card2 {
            gap: 50px;
            width: 550px;
            height: 250px;
            display: flex;
            padding: 18px 24px;
            overflow: hidden;
            flex-wrap: wrap;
            align-items: flex-start;
            flex-shrink: 0;
            border-color: rgba(0, 0, 0, 0);
            border-style: solid;
            border-width: 1.5px;
            border-radius: 16px;
            justify-content: flex-end;
            background-color: rgba(36, 78, 126, 0.09000000357627869);
          }
          .page1-frame3 {
            gap: 128px;
            width: 494px;
            height: 30px;
            display: flex;
            align-items: center;
            flex-shrink: 0;
            justify-content: space-between;
          }
          .page1-text15 {
            color: rgb(26, 32, 39);
            width: 100%;
            height: auto;
            font-size: 36px;
            font-style: Bold;
            text-align: left;
            font-family: 'Plus Jakarta Sans';
            font-weight: 700;
            line-height: 24px;
            font-stretch: normal;
            text-decoration: none;
          }
          .page1-frame22 {
            gap: 165px;
            width: 494px;
            display: flex;
            padding: 0 16px;
            align-items: center;
            flex-shrink: 0;
            justify-content: space-between;
          }
          .page1-numberdetail2 {
            gap: 10px;
            width: 1100px;
            height: 103px;
            display: flex;
            position: relative;
            align-items: flex-end;
            flex-shrink: 0;
            justify-content: flex-end;
          }
          .page1-text16 {
            left: 22px;
            color: rgb(26, 32, 39);
            width: 100%;
            height: auto;
            position: relative;
            font-size: 96px;
            align-self: flex-end;
            font-style: Bold;
            text-align: right;
            font-family: 'Plus Jakarta Sans';
            font-weight: 700;
            line-height: 40px;
            font-stretch: normal;
            text-decoration: none;
            padding-right: 40px;
          }
          .page1-text18 {
            font-size: 40px;
          }
          .page1-card-container2 {
            gap: 23px;
            height: 250px;
            display: flex;
            z-index: 2;
            align-items: flex-start;
            flex-shrink: 0;
          }
          .page1-number-card3 {
            width: 1147px;
            height: 250px;
            display: flex;
            padding: 18px 24px;
            overflow: hidden;
            flex-wrap: wrap;
            align-items: flex-start;
            flex-shrink: 0;
            border-color: rgba(0, 0, 0, 0);
            border-style: solid;
            border-width: 1.5px;
            border-radius: 16px;
            justify-content: flex-end;
            background-color: rgba(36, 78, 126, 0.09000000357627869);
          }
          .page1-frame4 {
            gap: 128px;
            width: 1100px;
            height: 30px;
            display: flex;
            align-items: center;
            flex-shrink: 0;
            justify-content: space-between;
          }
          .page1-text19 {
            color: rgb(26, 32, 39);
            width: 100%;
            height: auto;
            font-size: 36px;
            font-style: Bold;
            text-align: left;
            font-family: 'Plus Jakarta Sans';
            font-weight: 700;
            line-height: 24px;
            font-stretch: normal;
            text-decoration: none;
          }
          .page1-frame23 {
            gap: 165px;
            width: 1100px;
            display: flex;
            align-items: center;
            flex-shrink: 0;
            justify-content: space-between;
          }
          .page1-numberdetail3 {
            gap: 10px;
            width: 472px;
            height: 103px;
            display: flex;
            position: relative;
            align-items: center;
            flex-shrink: 0;
            justify-content: center;
          }
          .page1-text20 {
            left: 22px;
            color: rgb(26, 32, 39);
            width: 100%;
            height: auto;
            position: relative;
            font-size: 96px;
            align-self: flex-end;
            font-style: Bold;
            text-align: left;
            font-family: 'Plus Jakarta Sans';
            font-weight: 700;
            line-height: 40px;
            font-stretch: normal;
            text-decoration: none;
          }
          .page1-text21 {
            font-size: 80px;
          }
          .page1-text23 {
            font-size: 40px;
          }
          .page1-frame24 {
            gap: 36px;
            width: 1195px;
            height: 50px;
            display: flex;
            z-index: 3;
            position: relative;
            align-items: center;
            flex-shrink: 0;
            flex-direction: row;
            justify-content: space-between;
            padding: 0 24px;
          }
          .page1-text24 {
            color: rgb(74, 144, 226);
            font-size: 32px;
            font-style: Bold;
            text-align: left;
            font-family: 'Plus Jakarta Sans';
            font-weight: 700;
            line-height: 100%;
            font-stretch: normal;
            text-decoration: none;
          }
          
          /* Loading Animation Styles */
          .loading-animation {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            width: 100%;
          }

          .loading-dots {
            display: flex;
            gap: 8px;
            align-items: center;
            justify-content: center;
          }

          .loading-dots span {
            width: 12px;
            height: 12px;
            background-color: rgb(33, 116, 212);
            border-radius: 50%;
            display: inline-block;
            animation: bounce 1.4s infinite ease-in-out both;
          }

          .loading-dots span:nth-child(1) {
            animation-delay: -0.32s;
          }

          .loading-dots span:nth-child(2) {
            animation-delay: -0.16s;
          }

          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0);
              opacity: 0.3;
            }
            40% { 
              transform: scale(1);
              opacity: 1;
            }
          }
          
          /* Calibration button styles */
          .calibration-button-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 0px;
            width: 20%;
            padding: 0 24px;
            margin-left: -20px;
            margin-bottom: 40px;
          }

          .calibration-button {
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            background-color: rgb(33, 116, 212);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Plus Jakarta Sans';
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(33, 116, 212, 0.2);
          }
          
          .calibration-button:hover {
            background-color: rgb(26, 90, 165);
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(33, 116, 212, 0.3);
          }

          .calibration-button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
            box-shadow: none;
          }
          
          /* Modal styles */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10;
          }
          
          .calibration-modal {
            background-color: white;
            border-radius: 16px;
            padding: 40px;
            width: 500px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            text-align: center;
          }
          
          .calibration-modal h2 {
            font-family: 'Plus Jakarta Sans';
            font-weight: 700;
            font-size: 28px;
            color: rgb(26, 32, 39);
            margin-bottom: 20px;
          }
          
          .calibration-status {
            font-family: 'Plus Jakarta Sans';
            font-size: 18px;
            color: rgb(74, 74, 74);
            margin-bottom: 30px;
          }
          
          .progress-container {
            width: 100%;
            height: 20px;
            background-color: rgba(36, 78, 126, 0.1);
            border-radius: 10px;
            margin-bottom: 10px;
            overflow: hidden;
          }
          
          .progress-bar {
            height: 100%;
            background-color: rgb(33, 116, 212);
            transition: width 0.3s ease;
          }
          
          .progress-percentage {
            font-family: 'Plus Jakarta Sans';
            font-size: 18px;
            font-weight: 600;
            color: rgb(33, 116, 212);
            margin-bottom: 30px;
          }
          
          .cancel-button {
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            background-color: rgb(240, 240, 240);
            color: rgb(74, 74, 74);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Plus Jakarta Sans';
            transition: background-color 0.3s;
          }
          
          .cancel-button:hover {
            background-color: rgb(220, 220, 220);
          }

          /* Error Modal Styles */
          .error-modal {
            background-color: white;
            border-radius: 16px;
            padding: 40px;
            width: 400px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            text-align: center;
          }

          .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }

          .error-modal h2 {
            font-family: 'Plus Jakarta Sans';
            font-weight: 700;
            font-size: 28px;
            color: rgb(220, 53, 69);
            margin-bottom: 16px;
          }

          .error-modal p {
            font-family: 'Plus Jakarta Sans';
            font-size: 18px;
            color: rgb(74, 74, 74);
            margin-bottom: 30px;
          }

          .error-button {
            padding: 12px 32px;
            font-size: 16px;
            font-weight: 600;
            background-color: rgb(220, 53, 69);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Plus Jakarta Sans';
            transition: background-color 0.3s;
          }

          .error-button:hover {
            background-color: rgb(200, 35, 51);
          }

          /* Button styles */
          .button-container {
            display: flex;
            flex-direction: row;
            gap: 12px;
            width: 45%;
            margin-bottom: 0px;
          }

          .reset-button {
            width: 100%;
            padding: 12px 24px;
            font-size: 48px;
            font-weight: 600;
            background-color: rgb(220, 53, 69);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Plus Jakarta Sans';
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
          }
          
          .reset-button:hover {
            background-color: rgb(200, 35, 51);
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(220, 53, 69, 0.3);
          }
            .vital-sign-home-container10 {
  width: 100%;
  display: flex;
  overflow: auto;
  min-height: 100vh;
  align-items: center;
  flex-direction: column;
}
 
.vital-sign-home-dashboard {
  gap: 19px;
  width: 100%;
  height: auto;
  display: flex;
  padding: 0 48px;
  overflow: hidden;
  align-items: center;
  flex-shrink: 0;
  flex-direction: column;
  background-color: rgba(250, 252, 254, 1);
}
 
.vital-sign-home-basic-header {
  gap: 216px;
  display: flex;
  padding: 24px 0 0;
  align-self: stretch;
  align-items: center;
  flex-shrink: 0;
  justify-content: center;
  background-color: rgba(250, 252, 254, 1);
}
 
.vital-sign-home-hipertech-logo {
  width: 498px;
  height: 91px;
}
 
.vital-sign-home-card-container {
  gap: 23px;
  width: 1148px;
  height: 512px;
  display: flex;
  z-index: 1;
  align-items: flex-start;
  flex-shrink: 0;
  justify-content: space-between;
}
 
.vital-sign-home-number-card1 {
  gap: 50px;
  width: 300px;
  height: 512px;
  display: flex;
  padding: 18px 24px;
  overflow: hidden;
  flex-wrap: wrap;
  align-items: flex-start;
  flex-shrink: 0;
  border-color: rgba(0, 0, 0, 0);
  border-style: solid;
  border-width: 1.5px;
  border-radius: 16px;
  justify-content: center;
  background-color: rgba(36, 78, 126, 0.09000000357627869);
}
 
.vital-sign-home-frame1 {
  gap: 128px;
  width: 269px;
  display: flex;
  align-items: flex-start;
  flex-shrink: 0;
  flex-direction: column;
}
 
.vital-sign-home-text10 {
  color: rgba(26, 32, 39, 1);
  width: 269px;
  height: auto;
  font-size: 36px;
  font-style: Bold;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 700;
  line-height: 24px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-group46 {
  width: 235px;
  height: 276px;
  display: flex;
  position: relative;
  align-items: flex-start;
  flex-shrink: 1;
}
 
.vital-sign-home-frame-button1 {
  top: 0px;
  left: 0px;
  width: 235px;
  height: 66px;
  display: flex;
  padding: 0 12px;
  position: absolute;
  align-items: center;
  flex-shrink: 0;
  border-radius: 3px;
  justify-content: center;
  background-color: rgba(11, 101, 227, 1);
}
 
.vital-sign-home-container11 {
  gap: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
 
.vital-sign-home-text11 {
  color: rgba(255, 255, 255, 1);
  height: auto;
  font-size: 24px;
  font-style: Medium;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 500;
  line-height: 20px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-frame-button2 {
  top: 105px;
  left: 0px;
  width: 235px;
  height: 66px;
  display: flex;
  padding: 0 12px;
  position: absolute;
  align-items: center;
  flex-shrink: 0;
  border-radius: 3px;
  justify-content: center;
  background-color: rgba(11, 101, 227, 1);
}
 
.vital-sign-home-container12 {
  gap: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
 
.vital-sign-home-text12 {
  color: rgba(255, 255, 255, 1);
  height: auto;
  font-size: 24px;
  font-style: Medium;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 500;
  line-height: 20px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-frame-button3 {
  top: 210px;
  left: 0px;
  width: 235px;
  height: 66px;
  display: flex;
  padding: 0 12px;
  position: absolute;
  align-items: center;
  flex-shrink: 0;
  border-radius: 3px;
  justify-content: center;
  background-color: rgba(11, 101, 227, 1);
}
 
.vital-sign-home-container13 {
  gap: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
 
.vital-sign-home-text13 {
  color: rgba(255, 255, 255, 1);
  height: auto;
  font-size: 24px;
  font-style: Medium;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 500;
  line-height: 20px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-number-card2 {
  gap: 48px;
  width: 291px;
  height: 512px;
  display: flex;
  padding: 18px 24px;
  overflow: hidden;
  align-items: center;
  flex-shrink: 0;
  border-color: rgba(0, 0, 0, 0);
  border-style: solid;
  border-width: 1.5px;
  border-radius: 16px;
  flex-direction: column;
  background-color: rgba(36, 78, 126, 0.09000000357627869);
}
 
.vital-sign-home-frame4 {
  gap: 128px;
  width: 278px;
  display: flex;
  align-items: flex-start;
  flex-shrink: 0;
  flex-direction: column;
}
 
.vital-sign-home-text14 {
  color: rgba(26, 32, 39, 1);
  height: auto;
  font-size: 36px;
  align-self: stretch;
  font-style: Bold;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 700;
  line-height: 24px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-text15 {
  color: rgba(94, 77, 178, 1);
  height: auto;
  font-size: 36px;
  font-style: Medium;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 500;
  line-height: 24px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-frame-button4 {
  width: 235px;
  height: 66px;
  display: flex;
  padding: 0 12px;
  align-items: center;
  flex-shrink: 0;
  border-radius: 3px;
  justify-content: center;
  background-color: rgba(0, 122, 94, 1);
}
 
.vital-sign-home-container14 {
  gap: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
 
.vital-sign-home-text16 {
  color: rgba(255, 255, 255, 1);
  height: auto;
  font-size: 24px;
  font-style: Medium;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 500;
  line-height: 20px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-text17 {
  color: rgba(94, 77, 178, 1);
  height: auto;
  font-size: 36px;
  align-self: stretch;
  font-style: Medium;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 500;
  line-height: 24px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-frame-button5 {
  width: 235px;
  height: 66px;
  display: flex;
  padding: 0 12px;
  align-items: center;
  flex-shrink: 0;
  border-radius: 3px;
  justify-content: center;
  background-color: rgba(0, 122, 94, 1);
}
 
.vital-sign-home-container15 {
  gap: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
 
.vital-sign-home-text18 {
  color: rgba(255, 255, 255, 1);
  height: auto;
  font-size: 24px;
  font-style: Medium;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 500;
  line-height: 20px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-frame471 {
  gap: 53px;
  height: 512px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  flex-direction: column;
}
 
.vital-sign-home-number-card3 {
  gap: 28px;
  width: 450px;
  height: 230px;
  display: flex;
  padding: 18px 24px;
  overflow: hidden;
  align-items: flex-end;
  flex-shrink: 0;
  border-color: rgba(0, 0, 0, 0);
  border-style: solid;
  border-width: 1.5px;
  border-radius: 16px;
  flex-direction: column;
  background-color: rgba(36, 78, 126, 0.09000000357627869);
}
 
.vital-sign-home-frame31 {
  gap: 25px;
  display: flex;
  align-self: stretch;
  align-items: flex-start;
  flex-direction: column;
}
 
.vital-sign-home-frame5 {
  gap: 128px;
  width: 402px;
  height: 30px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  justify-content: space-between;
}
 
.vital-sign-home-text19 {
  color: rgba(26, 32, 39, 1);
  width: 402px;
  height: auto;
  font-size: 36px;
  font-style: Bold;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 700;
  line-height: 24px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-frame6 {
  display: flex;
    justify-content: space-between;
          width:100%;
}
 
.vital-sign-home-text20 {

  color: rgb(26, 32, 39);
  height: auto;
  font-size: 36px;
  font-style: Medium;
  text-align: left;
  font-family: "Plus Jakarta Sans";
  font-weight: 500;
  line-height: 24px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-text21 {
  color: rgba(26, 32, 39, 1);
  height: auto;
  font-size: 36px;
  font-style: Medium;
  text-align: left;
  font-family: Plus Jakarta Sans;
  font-weight: 500;
  line-height: 24px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-frame472 {
 display: flex;
    justify-content: space-between;
          width:100%;
}
 
.vital-sign-home-frame-button6 {
  width: 150px;
  height: 66px;
  display: flex;
  padding: 0 12px;
  align-items: center;
  flex-shrink: 0;
  border-radius: 3px;
  justify-content: center;
  background-color: rgba(0, 122, 94, 1);
}
 
.vital-sign-home-container16 {
  gap: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
 
.vital-sign-home-text22 {
  color: rgba(255, 255, 255, 1);
  height: auto;
  font-size: 24px;
  font-style: Medium;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 500;
  line-height: 20px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-frame-button7 {
  width: 150px;
  height: 66px;
  display: flex;
  padding: 0 12px;
  align-items: center;
  flex-shrink: 0;
  border-radius: 3px;
  justify-content: center;
  background-color: rgba(0, 122, 94, 1);
}
 
.vital-sign-home-container17 {
  gap: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
 
.vital-sign-home-text23 {
  color: rgba(255, 255, 255, 1);
  height: auto;
  font-size: 24px;
  font-style: Medium;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 500;
  line-height: 20px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-number-card4 {
  gap: 28px;
  width: 450px;
  height: 230px;
  display: flex;
  padding: 18px 24px;
  overflow: hidden;
  align-items: flex-end;
  flex-shrink: 0;
  border-color: rgba(0, 0, 0, 0);
  border-style: solid;
  border-width: 1.5px;
  border-radius: 16px;
  flex-direction: column;
  background-color: rgba(36, 78, 126, 0.09000000357627869);
}
 
.vital-sign-home-frame32 {
  gap: 25px;
  display: flex;
  align-self: stretch;
  align-items: flex-start;
  flex-direction: column;
}
 
.vital-sign-home-frame7 {
  gap: 128px;
  width: 402px;
  height: 30px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  justify-content: space-between;
}
 
.vital-sign-home-text24 {
  color: rgba(26, 32, 39, 1);
  width: 402px;
  height: auto;
  font-size: 36px;
  font-style: Bold;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 700;
  line-height: 24px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-frame8 {
 display: flex;
    justify-content: space-between;
          width:100%;
}
 
.vital-sign-home-text25 {
  color: rgba(26, 32, 39, 1);
  height: auto;
  font-size: 36px;
  font-style: Regular;
  text-align: left;
  font-family: Plus Jakarta Sans;
  font-weight: 400;
  line-height: 24px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-text26 {
  color: rgba(26, 32, 39, 1);
  height: auto;
  font-size: 36px;
  font-style: Medium;
  text-align: left;
  font-family: Plus Jakarta Sans;
  font-weight: 500;
  line-height: 24px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-frame473 {
 display: flex;
    justify-content: space-between;
          width:100%;
}
 
.vital-sign-home-frame-button8 {
  width: 150px;
  height: 66px;
  display: flex;
  padding: 0 12px;
  align-items: center;
  flex-shrink: 0;
  border-radius: 3px;
  justify-content: center;
  background-color: rgba(0, 122, 94, 1);
}
 
.vital-sign-home-container18 {
  gap: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
 
.vital-sign-home-text27 {
  color: rgba(255, 255, 255, 1);
  height: auto;
  font-size: 24px;
  font-style: Medium;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 500;
  line-height: 20px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-frame-button9 {
  width: 150px;
  height: 66px;
  display: flex;
  padding: 0 12px;
  align-items: center;
  flex-shrink: 0;
  border-radius: 3px;
  justify-content: center;
  background-color: rgba(0, 122, 94, 1);
}
 
.vital-sign-home-container19 {
  gap: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
 
.vital-sign-home-text28 {
  color: rgba(255, 255, 255, 1);
  height: auto;
  font-size: 24px;
  font-style: Medium;
  text-align: center;
  font-family: Plus Jakarta Sans;
  font-weight: 500;
  line-height: 20px;
  font-stretch: normal;
  text-decoration: none;
}
 
.vital-sign-home-frame2 {
  gap: 36px;
  width: 1184px;
  height: 65px;
  display: flex;
  padding: 20px 0 0;
  z-index: 2;
  position: relative;
  align-items: center;
  flex-shrink: 0;
  justify-content: center;
}
 
.vital-sign-home-wpfconnected {
  top: 9px;
  left: 0px;
  width: 48px;
  height: 48px;
  position: absolute;
}
 
.vital-sign-home-text29 {
  top: 17px;
  left: 914px;
  color: rgb(74, 144, 226);
  height: auto;
  position: absolute;
  font-size: 32px;
  font-style: Bold;
  text-align: left;
  font-family: "Plus Jakarta Sans";
  font-weight: 700;
  line-height: 100%;
  font-stretch: normal;
  text-decoration: none;
}

        `}
        
      </style>
    </>
  )
}
