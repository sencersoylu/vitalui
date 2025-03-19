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
  
  useEffect(() => {
    // Initialize socket connection
    const socket = io('http://localhost:4000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      extraHeaders: {
        "Access-Control-Allow-Origin": "http://localhost:8888"
      }
    });
    
    // Store socket reference
    setSocketRef(socket);
    
    // Handle connection event
    socket.on('connect', () => {
      console.log('Connected to socket server');
      setConnected(true);

      setTimeout(() => {
        socket.emit('serialSend', 'C');
      }, 1000);
      
      // Set current time on connection
      updateCurrentTime();
    });

    socket.on('serialData', (data) => {
      console.log('Received serial data:', data);
      if (data.data.includes('PRO:')) {
        setShowCalibrationModal(true);
        const progress = parseInt(data.data.split(':')[1]);
        setCalibrationProgress(progress);
        setCalibrationStatus(`Calibration in progress: ${progress}%`);
      }
      else if (data.data.includes('OK:CAL')) {
                socket.emit('serialSend', 'M');
        setShowCalibrationModal(false);
      }
      else if (data.data.includes('ERR:CAL')) {
        setShowCalibrationModal(false);

        setErrorMessage('Calibration failed. Please try again.');
        setShowErrorModal(true);
        setTimeout(() => {
          setShowErrorModal(false);
          socket.emit('serialSend', 'R');

        }, 3000);

      } else if (data.data.includes('DATA:')) {
        const dataArray = data.data.split(':')[1].split(',');
        
      
        if (dataArray[0] == '4') {
          setErrorMessage('Motion detected. Please keep your finger on the sensor.');
          setShowErrorModal(true);
        }
        else if (dataArray[0] == '5') {
          setErrorMessage('Estimation failed. Please try again.');
          setShowErrorModal(true);
        }
        else if (dataArray[0] == '1' || dataArray[0] == '2' || dataArray[0] == '3' || dataArray[0] == '6') {
          setVitalSigns({
            heartRate: dataArray[3],
            oxygenSaturation: dataArray[4],
            bloodPressure: dataArray[1] + "/" + dataArray[2]
          });
        }
      }
    });
    
    // Handle disconnection event
    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setConnected(false);
    });
    
    // Listen for vital signs updates
    socket.on('vitalSigns', (data) => {
      console.log('Received vital signs data:', data);
      setVitalSigns(data);
      updateCurrentTime();
    });
    
    // Listen for calibration progress updates
    socket.on('calibrationProgress', (data) => {
      console.log('Calibration progress:', data);
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
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setCurrentTime(formattedDate);
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
      socketRef.emit('startCalibration');
    }
  };

  return (
  <>
      <div className="page1-container">
        <Head>
          <title>Page1 - exported project</title>
          <meta property="og:title" content="Page1 - exported project" />
          <link
            href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </Head>
        <div className="page1-vital-sign-home">
          <div className="page1-basic-header">
            <img
              alt="HipertechLogo2501"
              src="/external/hipertechlogo2501-ygje.svg"
              className="page1-hipertech-logo"
            />
            <div className="page1-logo">
              <img
                alt="logomark2501"
                src="/external/logomark2501-ohe8.svg"
                className="page1-logomark"
              />
              <span className="page1-text10">VitalMonitor</span>
            </div>
          </div>
          <div className="page1-card-container1">
            <div className="page1-number-card1">
              <div className="page1-frame1">
                <span className="page1-text11">Heart Rate</span>
              </div>
              <div className="page1-frame21">
                <div className="page1-numberdetail1">
                  {vitalSigns.heartRate && vitalSigns.heartRate !== '0' ? (
                    <span className="page1-text12">
                      <span>
                        {vitalSigns.heartRate}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: ' ',
                          }}
                        />
                      </span>
                      <span className="page1-text14">bpm</span>
                    </span>
                  ) : (
                    <div className="loading-animation">
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="page1-number-card2">
              <div className="page1-frame3">
                <span className="page1-text15">Oxygen Saturation ( SpO2 )</span>
              </div>
              <div className="page1-frame22">
                <div className="page1-numberdetail1">
                  {vitalSigns.oxygenSaturation && vitalSigns.oxygenSaturation !== '0' ? (
                    <span className="page1-text16">
                      <span>
                        {vitalSigns.oxygenSaturation}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: ' ',
                          }}
                        />
                      </span>
                      <span className="page1-text18">%</span>
                    </span>
                  ) : (
                    <div className="loading-animation">
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="page1-card-container2">
            <div className="page1-number-card3">
              <div className="page1-frame4">
                <span className="page1-text19">Blood Pressure</span>
              </div>
              <div className="page1-frame23">
                <div className="page1-numberdetail2">
                  {vitalSigns.bloodPressure && vitalSigns.bloodPressure !== '0' ? (
                    <span className="page1-text16">
                      <span>
                        {vitalSigns.bloodPressure}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: ' ',
                          }}
                        />
                      </span>
                      <span className="page1-text18">mmHg</span>
                    </span>
                  ) : (
                    <div className="loading-animation">
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
        </div>
        <div className="page1-frame24">
         
          <span className="page1-text24">{currentTime || '10.03.2025 14:27'}</span>
        </div>
        
        {/* Calibration Modal */}
        {showCalibrationModal && (
          <div className="modal-overlay">
            <div className="calibration-modal">
              <h2>Please keep your finger on sensor untill progress reach 100%</h2>
              <div className="progress-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${calibrationProgress}%` }}
                ></div>
              </div>
              <p className="progress-percentage">{calibrationProgress}%</p>
              <button 
                className="cancel-button" 
                onClick={() => {
                  if (socketRef) {
                    socketRef.emit('cancelCalibration');
                  }
                  setShowCalibrationModal(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="modal-overlay">
            <div className="error-modal">
              <div className="error-icon">⚠️</div>
              <h2>Error</h2>
              <p>{errorMessage}</p>
              <button 
                className="error-button" 
                onClick={() => setShowErrorModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        )}
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
            gap: 216px;
            display: flex;
            padding: 24px 0 20px;
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
            gap: 50px;
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
            padding: 0 16px;
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
            width: 1184px;
            height: 50px;
            display: flex;
            z-index: 3;
            position: relative;
            align-items: flex-start;
            flex-shrink: 0;
            flex-direction: column;
            justify-content: center;
          }
          .page1-wpfconnected {
            top: 0px;
            left: 0px;
            width: 48px;
            height: 48px;
            position: absolute;
          }
          .page1-text24 {
            top: 0px;
            color: rgb(74, 144, 226);
            width: 100%;
            height: auto;
            display: flex;
            position: absolute;
            font-size: 32px;
            font-style: Bold;
            text-align: left;
            font-family: 'Plus Jakarta Sans';
            font-weight: 700;
            line-height: 100%;
            font-stretch: normal;
            flex-direction: row-reverse;
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
          .calibration-button {
            margin-top: 20px;
            padding: 15px 30px;
            font-size: 20px;
            font-weight: 600;
            background-color: rgb(33, 116, 212);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Plus Jakarta Sans';
            transition: background-color 0.3s;
          }
          
          .calibration-button:hover {
            background-color: rgb(26, 90, 165);
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
        `}
      </style>
    </>
  )
}
