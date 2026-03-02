const {MongoClient} = require('mongodb');
(async () => {
  try {
    const uri = 'mongodb+srv://larastephanny_db_user:EGKSHpjR6ZG9Yifd@agendamentos.0gjmnax.mongodb.net/agendamentos?retryWrites=true&w=majority';
    const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
    await client.connect();
    console.log('Connected!');
    await client.db('agendamentos').command({ping:1});
    console.log('Ping succeeded');
    await client.close();
  } catch(e) {
    console.error('Error connecting', e);
  }
})();
