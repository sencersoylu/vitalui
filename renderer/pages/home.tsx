import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
  <>
      <div className="page1-container">
        <Head>
          <title>Page1 - exported project</title>
          <meta property="og:title" content="Page1 - exported project" />
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
                <span className="page1-text11">Blood Pressure</span>
              </div>
              <div className="page1-frame21">
                <div className="page1-numberdetail1">
                  <span className="page1-text12">
                    <span>
                      72
                      <span
                        dangerouslySetInnerHTML={{
                          __html: ' ',
                        }}
                      />
                    </span>
                    <span className="page1-text14">bpm</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="page1-number-card2">
              <div className="page1-frame3">
                <span className="page1-text15">Oxygen Saturation ( SpO2 )</span>
              </div>
              <div className="page1-frame22">
                <div className="page1-numberdetail2">
                  <span className="page1-text16">
                    <span>
                      72
                      <span
                        dangerouslySetInnerHTML={{
                          __html: ' ',
                        }}
                      />
                    </span>
                    <span className="page1-text18">%</span>
                  </span>
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
                <div className="page1-numberdetail3">
                  <span className="page1-text20">
                    <span className="page1-text21">120/80</span>
                    <span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: ' ',
                        }}
                      />
                    </span>
                    <span className="page1-text23">mmHg</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="page1-frame24">
          <img
            alt="wpfconnectedI250"
            src="/external/wpfconnectedi250-lt9t.svg"
            className="page1-wpfconnected"
          />
          <span className="page1-text24">10.03.2025 14:27</span>
        </div>
      </div>
      <style jsx>
        {`
          .page1-container {
            width: 100%;
            height: 720px;
            display: flex;
            align-items: center;
            flex-direction: column;
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
            width: 480px;
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
          .page1-frame4 {
            gap: 128px;
            width: 494px;
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
            width: 494px;
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
        `}
      </style>
    </>
  )
}
