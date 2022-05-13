/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract, JSONSerializer } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

const shim = require('fabric-shim')
const statebased = require('fabric-shim/lib/utils/statebased')


class ZeusContract extends Contract {


    async zeusExists(ctx, zeusId) {
        const buffer = await ctx.stub.getState(zeusId);
        return (!!buffer && buffer.length > 0);
    }

    async createZeus(ctx, zeusId,pd) {
        const exists = await this.zeusExists(ctx, zeusId);
        if (exists) {
            throw new Error(`The zeus ${zeusId} already exists`);
        }
        const clientid = ctx.clientIdentity.getMSPID();
        const asset = { zeusId,
            pd,
            clientid,
            assetType:"asset"
        };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(zeusId, buffer);
        const k=await this.setAssetStateBasedEndorsement(ctx,clientid,zeusId);
        return k;
        
    }

    async readZeus(ctx, zeusId) {
        const exists = await this.zeusExists(ctx, zeusId);
        if (!exists) {
            throw new Error(`The zeus ${zeusId} does not exist`);
        }
        const buffer = await ctx.stub.getState(zeusId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async updateZeus(ctx, zeusId, newValue) {
        const exists = await this.zeusExists(ctx, zeusId);
        if (!exists) {
            throw new Error(`The zeus ${zeusId} does not exist`);
        }
        const asset = { value: newValue };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(zeusId, buffer);
    }

    async deleteZeus(ctx, zeusId) {
        const exists = await this.zeusExists(ctx, zeusId);
        if (!exists) {
            throw new Error(`The zeus ${zeusId} does not exist`);
        }
        await ctx.stub.deleteState(zeusId);
    }
    async setAssetStateBasedEndorsement(ctx,zeusId,orgToEndorse){
        const role = "PEER"
        const endorsementpolicy = new shim.KeyEndorsementPolicy();
        endorsementpolicy.addOrgs(role,orgToEndorse);
        const policy =  endorsementpolicy.getPolicy();
        await ctx.stub.setStateValidationParameter(zeusId, policy);
        const res = policy.toString();

        console.log(policy,"policy")
        console.log(res,"res")
    }
}

module.exports = ZeusContract;
