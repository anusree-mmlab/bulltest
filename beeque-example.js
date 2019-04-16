const express = require('express');
const app = express();
const Queue = require('bee-queue');
const Arena = require('bull-arena');
const queue = new Queue('example');


//app.get('/', (req, res) => res.send('Hello World!'));

app.use('/', Arena(
  {
    queues: [
      {
        name: 'example',
        hostId: 'Worker',
        type: "bee",
        redis: {
          host: 'localhost',
          port: Number(6379),
          database: ('/0').substr(1) || '0',
          password: undefined
        }
      }
    ]
  },
  {
    basePath: '/',
    disableListen: true
  }
));

app.get('/queue/:x/:y', (req, res) => {
  queue.createJob({ x: req.params.x, y: req.params.y }).save().then(job => {
    job.on('succeeded', (result) => {
      console.log(`Received result for job ${job.id}: ${result}`);
    });
    job.on('failed', (err) => {
      console.log(`Job ${job.id} failed with error ${err.message}`);
    });
  });
  res.send('Post to Queue!')
}
);

app.get('/process', (req, res) => {
  queue.process(async (job) => {
    job.reportProgress(10);
    console.log(`Processing job ${job.id}!!!!!!!!!!!`);
    setTimeout(function() { 
      job.reportProgress(100)
    }, 2000);
    return job.data.x + job.data.y;
  });
  res.send('Processed Queue!')
});

app.listen(4500, () => console.log('Example app listening on port 4500!'));