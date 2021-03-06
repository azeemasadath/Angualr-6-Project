import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, FormArray} from '@angular/forms'
import { CustomValidators} from '../shared/custom.validators' 
import { ActivatedRoute } from '@angular/router';
import {IEmployee} from './IEmployee';
import {EmployeeService} from './employee.service';
import {ISkill} from './ISkills';
import {Router} from '@angular/router'



@Component({
  selector: 'app-create-employee', 
  templateUrl: './create-employee.component.html',
  styleUrls: ['./create-employee.component.css']
})
export class CreateEmployeeComponent implements OnInit {

/*  FormBuilder class is provided as a service, so for us to be able to use 
 we will have to inject it using constructor. */ 
  
 constructor(private fb: FormBuilder,
              private route: ActivatedRoute,
              private employeeService: EmployeeService,
              private router: Router ) { }

  employeeForm: FormGroup;
  fullNameLength = 0;
  employee : IEmployee;
  pageTitle: string;

  validationMessages = {
    'fullName': {
      'required' : 'Full Name is required',
      'minlength' : 'Full Name must be greater than 2 charecters',
      'maxlength' : 'Full Name must be less than 10 charecters'
    },
    'email': {
      'required' : 'Email is required',
      'emailDomain' : 'Domain should be pragimtech.com'
    },
    'confirmEmail': {
      'required' : 'Confrim Email is required',
    },
    'emailGroup': {
      'missMatch' : 'Confrim Email doesnt match with the email provided',
    },
    'phone': {
      'required' : 'Phone is required'
    }    
  };

  formErrors = {
    'fullName': '',
    'email' : '',
    'confirmEmail' : '',
    'emailGroup' : '',
    'phone' : '',
    'skillName': '',
    'experienceInYears':'',
    'proficiency':''
    
  };
 
  ngOnInit(): void {

    // Building reactive form using formBuilder class
    this.employeeForm = this.fb.group({
      // All validator functions are sttaic functions, they dont need an instance.
      fullName:['',[Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      contactPreference:['email'],
      emailGroup : this.fb.group({
        email:['', [Validators.required,CustomValidators.emailDomain('pragimtech.com')]],
        confirmEmail:['', Validators.required],
      }, {validator : matchEmail}),
      phone:[''],
      skills: this.fb.array([
        this.addSkillFormGroup()
      ])
    });

    this.employeeForm.valueChanges.subscribe(
      (data) => {
        this.logValidationErrors(this.employeeForm);
      }
    );

    this.employeeForm.get('contactPreference').valueChanges.subscribe(
      (selectedValue:string) => {
        if(selectedValue === 'phone'){
          this.employeeForm.get('phone').setValidators(Validators.required),
          this.employeeForm.get('phone').updateValueAndValidity()
        }else{ 
          this.employeeForm.get('phone').clearValidators()
          this.employeeForm.get('phone').updateValueAndValidity()
        }
      }
    );

    this.route.paramMap.subscribe(params => {
      const empId = +params.get('id')

      if (empId) {
        this.getEmployee(empId);
        this.pageTitle = 'Edit Employee'
      }else{
        this.pageTitle = 'Create Employee'
        this.employee = {
          id : null,
          fullName : '',
          phone: null,
          contactPreference: '',
          email:'',
          skills :[]
      }
    }
    });
  }

  getEmployee(id: number){
    this.employeeService.getEmployee(id).subscribe(
      (employee:IEmployee) => { this.editEmployee(employee),
      this.employee = employee},
      (err:any) => console.log(err)
    );

  }

  editEmployee(employee:IEmployee){
    this.employeeForm.patchValue({
      fullName: employee.fullName,
      contactPreference: employee.contactPreference,
      emailGroup:{
        email: employee.email,
        confirmEmail:employee.email
      },
      phone:employee.phone
    });

    this.employeeForm.setControl('skills', this.setExistingSkills(employee.skills));
  }

  setExistingSkills(skillSets:ISkill[]):FormArray{
    const formArray = new FormArray([]);
    skillSets.forEach(s => {
      formArray.push( this.fb.group({
        skillName: s.skillName,
        proficiency: s.proficiency,
        experienceInYears: s.experienceInYears
      }));
    });
    return formArray;
  }

  removeSkillButtonClick(skillGroupIndex : number):void {
    const skillsFormArray = <FormArray>this.employeeForm.get('skills');
    skillsFormArray.removeAt(skillGroupIndex);
    skillsFormArray.markAsTouched();
    skillsFormArray.markAsDirty();

  }
  
  logValidationErrors(group: FormGroup = this.employeeForm) : void {
     Object.keys(group.controls).forEach((key:string) => 
     {
       
       const abstractControl = group.get(key);

       this.formErrors[key] = '';
       if(abstractControl && !abstractControl.valid && 
         (abstractControl.touched)|| (abstractControl.dirty)||(abstractControl.value != '')){
         const messages = this.validationMessages[key];  
         for (const errorKey in abstractControl.errors){
           if (errorKey){
             this.formErrors[key] += messages[errorKey] + ' ';
           }
         }
       }
       if(abstractControl instanceof FormGroup){
         this.logValidationErrors(abstractControl);
       }
      
     });
  }

  addSkillFormGroup() : FormGroup{
    return this.fb.group({
      skillName:['', Validators.required],
      experienceInYears:['', Validators.required],
      proficiency:['', Validators.required]
    })
  }
  addSkillButtonClick(): void{
    (<FormArray>this.employeeForm.get('skills')).push(this.addSkillFormGroup())
  }


  onSubmit(): void {
    this.mapFormValuesToEmployeeModel();
    if(this.employee.id){
    this.employeeService.updateEmployee(this.employee).subscribe(
      () => this.router.navigate(['employees']),
      (err: any) => console.log(err)
    );
  }else{
    this.employeeService.addEmployee(this.employee).subscribe(
      () => this.router.navigate(['employees']),
      (err: any) => console.log(err)
    );
  }
  }

  mapFormValuesToEmployeeModel(){

    console.log(this.employeeForm.value.fullName);

    this.employee.fullName = this.employeeForm.value.fullName;
    this.employee.contactPreference = this.employeeForm.value.contactPreference;
    this.employee.email = this.employeeForm.value.emailGroup.email;
    this.employee.phone = this.employeeForm.value.phone;
    this.employee.skills = this.employeeForm.value.skills;

    

  }

  onLoadDataClick() : void {
    // this.logValidationErrors(this.employeeForm);
    // console.log(this.formErrors);
  }

}

function matchEmail(group: AbstractControl): { [key: string]: any } | null {

  const emailControl = group.get('email');
  const confirmEmailControl = group.get('confirmEmail');

  if (emailControl.value === confirmEmailControl.value || (confirmEmailControl.pristine && confirmEmailControl.value ==='')) {
    return null
  } else {
    return { 'missMatch': true }
  }
} 
