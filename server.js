var http = require('http');
var AdmZip = require('adm-zip');
var request = require('request');
const { v4: uuidv4 } = require('uuid');

http.createServer((req, res) => {
    switch (req.url) {
        case '/certs.mobileconfig':
            res.writeHead(200, { 'Content-Type': 'application/x-apple-aspen-mdm' });
            res.write(`<?xml version="1.0" encoding="UTF-8"?>
            <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
            <plist version="1.0">
                <dict>
                    <key>PayloadContent</key>
                    <array>`);

            request.get({ url: 'http://acraiz.icpbrasil.gov.br/credenciadas/CertificadosAC-ICP-Brasil/ACcompactado.zip', encoding: null }, (err, resAc, body) => {
                var zip = new AdmZip(body);
                var zipEntries = zip.getEntries('ICP*');
                var icp = /ICP.*/;
                zipEntries.filter(zipEntry => {
                    return icp.test(zipEntry.name);
                }).forEach(zipEntry => {
                    var k = zip.readAsText(zipEntry)
                    var k1 = k.split('\n');
                    var cert = k1.slice(1, k1.length - 2).join('');
                    res.write(`
                    <dict>
                        <key>PayloadType</key>
                        <string>com.apple.security.pkcs1</string>
                        <key>PayloadContent</key>
                        <data>${cert}</data>
                        <key>PayloadUUID</key>
                        <string>${uuidv4()}</string>
                        <key>PayloadDescription</key>
                        <string>CredentialSettings</string>
                        <key>PayloadIdentifier</key>
                        <string>${zipEntry.name}</string>
                        <key>PayloadOrganization</key>
                        <string></string>
                        <key>PayloadVersion</key>
                        <integer>1</integer>
                    </dict>`)
                });

                res.end(`
                </array>
                <key>PayloadDescription</key>
                <string>Certificados AC-ICP-Brasil, certificados disponibilizados em https://www.gov.br/iti/pt-br/assuntos/repositorio/certificados-das-acs-da-icp-brasil-arquivo-unico-compactado processados e disponibilizados como perfil para iOS.</string>
                <key>PayloadDisplayName</key>
                <string>CertificadosAC-ICP-Brasil</string>
                <key>PayloadIdentifier</key>
                <string>${uuidv4()}</string>
                <key>PayloadOrganization</key>
                <string></string>
                <key>PayloadRemovalDisallowed</key>
                <false />
                <key>PayloadType</key>
                <string>Configuration</string>
                <key>PayloadUUID</key>
                <string>${uuidv4()}</string>
                <key>PayloadVersion</key>
                <integer>1</integer>
            </dict>
        </plist>`, 'utf-8');
            });

            break;
        case '/':
        case 'index.html':
            res.writeHead(301, { 'Location': 'certs.mobileconfig' });
            res.end();
            break;
        default:
            res.writeHead(404, 'Not found');
            res.end();
            break;
    }
}).listen(process.env.PORT || 3000);
