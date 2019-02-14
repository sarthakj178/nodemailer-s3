const nodemailer = require('nodemailer');
const S3Accessor = require('./s3-accessor');
const fs = require('fs');

let s3Accessor = new S3Accessor();
const TEMP_DIR = '/tmp/';

var transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    requireTLS: true,
  auth: {
    user: 'qs-hr@tataprojects.com',
    pass: 'Tata@022019' 
  }
});

export class NodeMailerS3 {
    constructor(host, port, secure = false, requireTLS = false, userName, password) {
        this.host = host;
        this.port = port;
        this.secure = secure;
        this.requireTLS = requireTLS;
        this.userName = userName;
        this.password = password;

        this.transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: secure,
            requireTLS: requireTLS,
            auth: {
                user: userName,
                pass: password,
            }
        });
        console.log(host, port)
    }
    async sendMail(
        fromEmailAddress, fromName, replyToEmailAddress, toEmailAddresses, 
        ccEmailAddresses = [], bccEmailAddresses = [], subject, htmlBody, emailParams = {}, attachmentsS3Paths = []) {

    var mailOptions = {
        from: {
            name: fromName, // This will probably be ignored
            address: fromEmailAddress,
        },
        to: toEmailAddresses,
        cc: ccEmailAddresses,
        bcc: bccEmailAddresses,
        replyTo: replyToEmailAddress,
        subject: subject,
        html: htmlBody
    }
    var attachmentPaths = [];
    if (attachmentsS3Paths.length > 0) {
        for (const path of attachmentsS3Paths) {
            console.log(path);
            let [s3Bucket, s3Key, fileName] = s3Accessor.parseS3Path(path);
            
            var tempFilePath = TEMP_DIR + fileName;
            try {
                var data = await s3Accessor.getFile(s3Bucket, s3Key);
                fs.writeFileSync(tempFilePath, data.Body);
                attachmentPaths.push({path: tempFilePath});
            } catch(err) {
                console.error("Unable to get attachment from S3", err);
                throw err;
            }
        }
    }
    mailOptions.attachments = attachmentPaths;
    console.log(this.transporter, mailOptions);
    try {
        var response = await this.transporter.sendMail(mailOptions);
        console.log(response);
    } catch (err) {
        console.error(err);
        throw err;
    }
}
}

