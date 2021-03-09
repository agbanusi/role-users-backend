const jwt = require('jsonwebtoken')
const secret = "Hellow Helllo Hellloo/\\"
const bcrypt = require("bcrypt")
const SchemaValidator = require('./validator');
const validateRequest = SchemaValidator(false);
const SchemaValidator2 = require('./validator2');
const validateRequest2 = SchemaValidator2(false);

function verify(req, res, next){
    //console.log(req.body)
    jwt.verify(req.body.token, secret, function(err, decoded) {
        
        if (err) return res.status(401).send({ status:"unauthorized", message: err });
        
        req.user = {email:decoded.email, role: decoded.role}
        next()
    });
}


module.exports = function (app, dbe){
    const trash= dbe.collection('myInvestUserTrash')
    const user = dbe.collection('myInvestUsers')
    
    //user.createIndex( { firstName: "text", lastName: "text", role: "text" } )
    
    app.post('/loginUser', validateRequest, (req, res)=>{
        const {email, password} = req.body
        if(email && password){
            user.findOne({email}, (err,doc)=>{
                if(doc){
                    var token = jwt.sign({email: doc.email, password:doc.password, role: doc.role, time: Date.now()} , secret, {
                        expiresIn: 86400 // expires in 24 hours
                    });

                    let result = bcrypt.compareSync(password, doc.password)
                    delete doc.password
                    
                    if(result){
                        res.json({status:"success",message: "Login successful", data: doc, token})
                    }
                    else{
                        res.status(401).json({status:"Unauthorized",error:401, message:"Email or Password incorrect"})
                    }
                }else{
                    res.status(401).json({status:"Unauthorized",error:401, message:"Email or Password incorrect"})
                }
            })
        }else{
            res.status(400).json({status:"Failed",error:400, message:"Incomplete data"})
        }
    })

    app.post('/registerUser', validateRequest, (req,res)=>{
        var {email, firstName, lastName, phone, password, role} = req.body
        user.findOne({email}, (err,doc)=>{
            if(doc){
                res.status(400).json({status:"Failed",error:400, message:"User already registered"})
            }else{
                password = bcrypt.hashSync(password,13)

                var token = jwt.sign({email: email, password:password, role: role, time: Date.now()} , secret, {
                    expiresIn: 86400 // expires in 24 hours
                });

                user.insertOne({email, firstName, lastName, phone, role, password, createdAt: new Date(), updatedAt: new Date()}, (err, docs)=>{
                    res.json({status:"success", message:"registered successfully", token})
                })
            }
        })
    })

    

    app.get('/getUsers', validateRequest2, async (req,res)=>{
        let {sort, page, search, toDate, fromDate} = req.query
        
        search= search? search:""
        toDate = toDate? new Date(toDate): new Date()
        fromDate = fromDate? new Date(fromDate): new Date(0)
        //console.log(search, toDate, fromDate)
        var data = await user.find({
                    createdAt: {
                        $gte: fromDate,
                        $lte: toDate
                    }
                })
        //console.log(data)
        if (sort=="ASC"){
            data = await user.find({
                createdAt: {
                    $gte: fromDate,
                    $lte: toDate
                }
            })
            .sort({
                    createdAt:1, firstName:1, lastName:1, role:1
                })
        }else if(sort == 'DESC'){
            data = await user.find({
                createdAt: {
                    $gte: fromDate,
                    $lte: toDate
                }
            })
            .sort({
                    createdAt:-1, firstName:-1, lastName:-1, role:-1
                })
        }
        //console.log(data)
        data = await data.toArray()
        
        if(search.length >0){
            data=data.filter(i=> i.firstName.trim().toLowerCase().includes(search.toLowerCase()) || 
            i.lastName.toLowerCase().trim().includes(search.toLowerCase()) ||
            i.role.toLowerCase().includes(search.toLowerCase()))
        }

        if(page){
            data = data.slice((page-1)*100, (page)*100)
        }
        

        res.json({users: data})
    })

    

    app.post('/getSingleUser', validateRequest, verify, (req, res)=>{
        const {email, role} = req.user
        if(email){
            user.findOne({email}, (err,doc)=>{
                if(doc){
                    delete doc._id
                    delete doc.password
                    res.json({status:"success", message: "User registered", data: doc})
                }else{
                    res.status(404).json({status:"Not found", error:404, message:"User not found"})
                }
            })
        }else{
            res.status(400).json({status:"Failed", message:"Missing Email data", error:400})
        }
    })

    app.post('/deleteUser', validateRequest, verify, async (req, res)=>{
        var {email, role} = req.user
        const emailUser = req.body.email
        let very = await user.findOne({email})

        if(email && very){
            if(emailUser){
                user.findOne({email: emailUser}, (err,doc)=>{
                    if(doc){
                        if(role == 'ADMIN'){
                            delete doc._id
                            trash.insertOne({...doc})
                            user.findOneAndDelete({email: emailUser})
                            res.json({status:"success", message: "User successfully deleted"})
                        }else{
                            res.status(401).json({status:"Unauthorized", error:401, message: "Only admin can delete third party profiles"})
                        }
                    }else{
                        res.status(404).json({status:"Not found", error:404, message:"User not found"})
                    }
                })
            }else{
                user.findOne({email}, (err,doc)=>{
                    if(doc){
                        delete doc._id
                        trash.insertOne({...doc})
                        user.findOneAndDelete({email})
                        res.json({status:"success", message: "User successfully deleted"})
                        
                    }else{
                        res.status(404).json({status:"Not found", error:404, message:"User not found"})
                    }
                })
            }
        }else{
            res.status(400).json({status:"Failed", message:"Missing Email data", error:400})
        }
    })
    
}