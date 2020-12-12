export const parseFirebase = (res, setState) => {
  let arr = [];

  arr = res.map((a) => {
    let jsonfins = { id: "", data: {} };

    jsonfins.id = a.id;
    delete a._id;
    jsonfins.data = a;

    return jsonfins;
  });
  setState(arr);
};

export const parseFirebaseNorm = (res, setState) => {
  let jsonfins = { id: "", data: {} };

  jsonfins.id = res.id;

  delete res._id;
  jsonfins.data = res;

  setState(jsonfins);
};
