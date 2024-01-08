import path from 'path';
import './bin/migrate';

import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import handlers from './handlers';

// TODO make this microservice work as a client for socket

// import { Emitter } from "@socket.io/redis-emitter";
// import { createClient } from "redis";


// const redisClient = createClient({ url: 'redis://redis_db:6379' });
// const sub = redisClient.duplicate({ return_buffers: false });

// redisClient.connect().then(()=>{
//   const emitter = new Emitter(redisClient);
//   setTimeout(  () => {
//     console.log('EMITTER1')
//     emitter.emit('news',  'news EMITTED');
//     console.log('EMITTER2')
//   }, 10000);
// });
//  redisClient.on('greeting', (m)=>{console.log(m)});
//
//  await  sub.connect();
//  await  sub.on('greeting', (m)=>{console.log(m)});
//  await  sub.subscribe('greeting', (m)=>{console.log(m)});
 // await  sub.subscribe('hello', (m)=>{console.log(m)});
 // sub.on('ev', (m)=>{console.log(m)});
 // redisClient.on('ev', (m)=>{console.log(m)});
 // await redisClient.connect();

// await sub.subscribe('dd', (d)=>{
//   console.log(d, 2222)
// })
// setTimeout(async () => {
//   await redisClient.publish('g', 'some GGGG news');
// }, 10000);

// setTimeout(async () => {
//   await redisClient.publish('news', 'some dummy news');
// }, 12000);

const port = process.env.USERS_PORT || 4002;
const packageDefiniton = protoLoader.loadSync(
    path.resolve('src/protos/users.proto'),
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    },
);

const { users } = grpc.loadPackageDefinition(packageDefiniton);

(function () {
    const server = new grpc.Server();
    server.addService(users.Users.service, handlers);
    server.bindAsync(
        `0.0.0.0:${port}`,
        grpc.ServerCredentials.createInsecure(),
        () => {
            server.start();
            console.log(`0.0.0.0:${port}: service-users started`);
        },
    );
})();




