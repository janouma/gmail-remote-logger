# gmail-remote-logger

Service that receives logs via notifications and sends it via email

## Install

```bash
npm i
```

## Start up

```bash
PORT=<port> MAIL_API_KEY=<gmail api key> MAIL_FROM=<sender address> MAIL_TO=<recipient address> LOG_LEVEL=[ silent | error | info | debug | trace ] npm start
```

## Usage

### Call

_The following code snippet can be used as is with **Vscode REST Client** extension_

```bash
POST http://localhost:3010
Content-Type: text; charset=utf-8
Origin: http://localhost

"log message"
```

### Response

```bash
HTTP/1.1 200 OK
Date: Sun, 11 Oct 2020 11:55:13 GMT
Connection: close
Content-Length: 25

message sent successfully
```
