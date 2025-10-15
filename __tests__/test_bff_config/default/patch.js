export default function handler(req, res) {
    res.send("this is /default/patch");
}

export const config = { 
    httpMethod: 'patch',
    middleware: []
};