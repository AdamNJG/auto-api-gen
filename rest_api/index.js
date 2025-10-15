
export async function handler(req, res) {
    res.send({
      "message": "this is the other api"
    });
}

export const config = {
  httpMethod: 'get',
  middleware: []
};