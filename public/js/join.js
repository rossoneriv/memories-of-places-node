const join = (() => {

    const form = document.querySelector('#joinForm') || document.querySelector('#modiForm');
    const type = form.dataset.formType;

    if(type === 'join'){
        form.querySelector('#username').addEventListener('blur', (e) => {
            userNameDupCheckEvent(e.target);
        });

        form.querySelector('#email').addEventListener('blur', (e) => {
            emailFormValidate(e.target);
        });

        form.querySelector('#password').addEventListener('blur', (e) => {
            blankValidation(e.target);
        });

        form.querySelector('#nickname').addEventListener('blur', (e) => {
            blankValidation(e.target);
        });

        document.querySelector('#joinButton').addEventListener('click', (e) => {
            const form = _validate();
            if(form.querySelectorAll('input.is-invalid').length > 0){
                return;
            }
            else{
                const data = {
                    username: form.querySelector('#username').value,
                    password: form.querySelector('#password').value,
                    nickname: form.querySelector('#nickname').value,
                    email: form.querySelector('#email').value
                }
                const xhr = new XMLHttpRequest();
                xhr.open("POST", `/users/join/${data.username}`, true);
                xhr.setRequestHeader('Content-type', 'application/json');
                xhr.send(JSON.stringify(data));
                xhr.addEventListener('load', function() {
                    var res = JSON.parse(xhr.responseText);
                    if(res.affectedRows === 1){
                        console.log('정상적으로 회원가입이 완료되었습니다.');
                        location.href = '/start';
                        alert('정상적으로 회원가입이 완료되었습니다.');
                    } else {
                        alert('회원가입 처리 중 문제가 발생하였습니다.');
                    }
                });
            }
        });
    } else if(type === 'modi') {
        form.querySelector('#nickname').value = loginUser.nickname;
        form.querySelector('#email').value = loginUser.email;

        form.querySelector('#email').addEventListener('blur', (e) => {
            emailFormValidate(e.target);
        });

        form.querySelector('#passwordConfirm').addEventListener('blur', (e) => {
            if(e.target.value !== e.target.previousElementSibling.value) {
                e.target.classList.add('is-invalid');
                e.target.nextElementSibling.textContent = '변경할 비밀번호가 일치하지 않습니다.';
            } else {
                e.target.classList.remove('is-invalid');
                e.target.nextElementSibling.textContent = '';
            }
        });

        document.querySelector('#modiButton').addEventListener('click', (e) => {
            const form = _validate();
            form.querySelector('#passwordBefore').nextElementSibling.textContent = '';
            if(form.querySelectorAll('input.is-invalid').length > 0){
                return;
            }
            else{
                const data = {
                    password: form.querySelector('#passwordBefore').value,
                    newPassword : form.querySelector('#passwordNew').value || '',
                    nickname: form.querySelector('#nickname').value,
                    email: form.querySelector('#email').value
                }
                const xhr = new XMLHttpRequest();
                xhr.open("PATCH", `/users/modi`, true);
                xhr.setRequestHeader('Content-type', 'application/json');
                xhr.send(JSON.stringify(data));
                xhr.addEventListener('load', function(res) {
                    const result = JSON.parse(res.target.responseText);
                    const form = this;
                    if(result.result) {
                        // loginUser.nickname = form.querySelector('#nickname').value;
                        // loginUser.email = form.querySelector('#email').value;
                        location.href = '/main';
                    } else {
                        form.querySelector('#passwordBefore').nextElementSibling.textContent = '비밀번호가 틀립니다.';
                    }
                }.bind(form));
            }
        });

        document.querySelector('#exitButton').addEventListener('click', (e) => {
            if(confirm('회원탈퇴하시겠습니까?')){
                const xhr = new XMLHttpRequest();
                xhr.open('PATCH' , `/users/withdrawal` , true);
                xhr.send();
                xhr.addEventListener('load', function(e) {
                    location.href = '/users/logout';
                });
            }
        });
    }

    const userNameDupCheckEvent = (el) => {
        const xhr = new XMLHttpRequest();
        const username = el.value;
        if(username !== ''){
            xhr.open("GET", `/users/idDupCheck/${username}`, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.send();

            xhr.addEventListener('load', function() {
                const {success, msg} = JSON.parse(xhr.responseText);
                if(!success) {
                    this.classList.add('is-invalid');
                    this.nextElementSibling.textContent = msg;
                } else {
                    this.classList.remove('is-invalid');
                    this.nextElementSibling.textContent = '';
                }
            }.bind(el));
        }
    }

    const emailFormValidate = (el) => {
        const email = el.value;
        const regExp = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
        if(email === '') {
            el.classList.add('is-invalid');
            el.nextElementSibling.textContent = '';
        } else if(!email.match(regExp)) {
            el.classList.add('is-invalid');
            el.nextElementSibling.textContent = '유효하지 않은 E-mail 입니다.';
        } else {
            el.classList.remove('is-invalid');
            el.nextElementSibling.textContent = '';
        }
    }

    const blankValidation = (el) => {
        if(el.value === ''){
            el.classList.add('is-invalid');
        } else {
            el.classList.remove('is-invalid');
        }
    }

    const _validate = function() {
        this.querySelectorAll('input.require').forEach((el) => {
            if(el.classList.contains('is-invalid')){
                return false;
            }
            else{
                if(el.value === ''){
                    el.classList.add('is-invalid');
                } else {
                    el.classList.remove('is-invalid');
                }
            }
        });
        return this;
    }.bind(form);

    return {
        validate: () => {
            _validate();
        }
    }
})();