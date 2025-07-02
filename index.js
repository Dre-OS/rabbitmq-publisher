// const express = require('express');
// const cors = require('cors');
// const port = 3002;
const amqp = require('amqplib');
// const app = express();
// app.use(cors());
// app.use(express.json());

async function connect(uri) {
    try {
        if (!uri) {
            uri = 'amqp://guest:guest@localhost:5672';
            console.warn("No RabbitMQ URI provided, using default 'amqp://guest:guest@localhost:5672'");
        }
        const connection = await amqp.connect(uri);
        const channel = await connection.createChannel();
        console.log("Connected to RabbitMQ successfully");
        return { connection, channel };
    } catch (error) {
        console.error("Failed to connect to RabbitMQ:", error);
        throw error;
    }
}

// {exchange, exchangeType, routingKey, queue, headers, options}
function composePublisher(props) {
  const defaultOptions = {
    durable: true,
    exclusive: false,
    autoDelete: false
  }

  
  return async (channel, message) => {
    try {
      // const {connection, channel} = await connect(connectionUri);

      {props.exchange ?
        channel.assertExchange(props.exchange, props.exchangeType, props.options || defaultOptions) :
        channel.assertQueue(props.queue, props.options || defaultOptions)
      }

      if (props.exchangeType === 'fanout') {
        channel.publish(props.exchange, '', Buffer.from(message));
      } else if (props.exchangeType === 'direct' || props.exchangeType === 'topic') {
        channel.publish(props.exchange, props.routingKey, Buffer.from(message)) 
      } 
      // else if (props.exchangeType === 'headers') {
      //   channel.publish(props.exchange, props.routingKey, Buffer.from(message), { props.headers, });
      // }
      else {
        throw new Error(`Unsupported exchange type: ${props.exchangeType}`);
      }
      console.log(`Message published to ${props.exchange} with routing key ${props.routingKey}`);
    } catch (error) {
      console.error('Error publishing message:', error);
    }
  };
  
}

// app.listen(port, "0.0.0.0", () => {
//   console.log(`Publisher service is running on port ${port}`);
// });

module.exports = {
  connect,
  composePublisher
}

